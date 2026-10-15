import { EcsGame } from '@gglib/components'
import { GameSystem, type GameWorld } from '@gglib/ecs'
import type { Texture } from '@gglib/graphics'
import { mat4GetTranslation, vec3, type IVec3 } from '@gglib/math'
import { MATERIAL_TEXTURE_SIZE } from '../../constants'
import { ContentService, normalizeAssetPath } from '../../content'
import { mtlTextureFile, parseMtl, type MtlMaterial } from '../../formats/mtl'
import {
  parseParticleLibrary,
  resolveParticleEffect,
  type ParticleEffect,
  type ParticleLibraryDocument,
} from '../../formats/particles'
import type { ParticleCamera } from './ParticleEmitter'

/**
 * Inputs of the Particles shader feature %SIGNED_DISTANCE_FIELD_2D (particles.cfi): the diffuse map is scrolled and
 * distorted by a noise map, the shape comes from a mask in the opacity slot
 */
export interface ParticleSdf2D {
  /** `[2] Custom` map ($CustomMap3), the distortion noise */
  noise: Texture
  /** `Opacity` map, alpha mask of the sprite (red channel) */
  mask: Texture
  /** SDF_2D_STRENGTH */
  strength: number
  /** SDF_2D_TILE_X/Y, SDF_2D_SPEED_X/Y, SDF_2D_PHASE_X/Y */
  tile: [number, number]
  speed: [number, number]
  phase: [number, number]
  /** SOURCE_2D_TILE_X/Y, SOURCE_2D_SPEED_X/Y, SOURCE_2D_PHASE_X/Y, applied to the diffuse map */
  sourceTile: [number, number]
  sourceSpeed: [number, number]
  sourcePhase: [number, number]
  /** SDF_2D_MASK_TILE_X/Y */
  maskTile: [number, number]
}

/**
 * Maximum simulation step, longer frames (e.g. a hidden tab) are clamped
 */
const MAX_STEP = 0.1

/**
 * Loads particle libraries and textures, and simulates the particle emitters of active {@link ParticleComponent}s
 */
export class ParticleSystem extends GameSystem {
  /**
   * Pauses the simulation, particles stay where they are
   */
  public paused = false

  /**
   * Statistics of the last update
   */
  public readonly stats = { components: 0, emitters: 0, particles: 0, time: 0 }

  private game: EcsGame
  private content: ContentService
  private libraries = new Map<string, Promise<ParticleLibraryDocument | null>>()
  private effects = new Map<string, Promise<ParticleEffect | null>>()
  private textures = new Map<string, Promise<Texture | null>>()
  private mtls = new Map<string, Promise<MtlMaterial | null>>()
  private sdfs = new Map<string, Promise<ParticleSdf2D | null>>()
  private active = new Set<ParticleUpdatable>()
  private camera: ParticleCamera = { position: vec3() }

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(EcsGame)
    this.content = world.getSystem(ContentService)
  }

  public get cameraPosition(): Readonly<IVec3> {
    return this.camera.position
  }

  public register(item: ParticleUpdatable) {
    this.active.add(item)
  }

  public unregister(item: ParticleUpdatable) {
    this.active.delete(item)
  }

  public update(time: number, dt: number): void {
    const start = performance.now()
    const view = this.game?.scene?.getView(0)
    if (view?.camera) {
      mat4GetTranslation(view.camera.world, this.camera.position)
    }
    const step = this.paused ? 0 : Math.min(dt, MAX_STEP)
    let emitters = 0
    let particles = 0
    for (const item of this.active) {
      item.updateParticles(step, this.camera)
      emitters += item.emitterCount
      particles += item.particleCount
    }
    this.stats.components = this.active.size
    this.stats.emitters = emitters
    this.stats.particles = particles
    this.stats.time = performance.now() - start
  }

  /**
   * Loads and resolves an effect of a particle library, null if it does not exist
   */
  public loadEffect(library: string, name: string): Promise<ParticleEffect | null> {
    const key = `${library}|${name}`.toLowerCase()
    if (!this.effects.has(key)) {
      this.effects.set(
        key,
        this.loadLibrary(library).then((lib) => {
          const effect = lib ? resolveParticleEffect(lib, name) : null
          if (lib && !effect) {
            console.warn('particle effect not found', library, name)
          }
          return effect
        }),
      )
    }
    return this.effects.get(key)
  }

  /**
   * Loads and parses a particle library, null if it fails
   */
  public loadLibrary(path: string): Promise<ParticleLibraryDocument | null> {
    const key = normalizeAssetPath(path)
    if (!this.libraries.has(key)) {
      this.libraries.set(
        key,
        fetch(this.content.nwbtFileUrl + key)
          .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`${res.status} ${res.statusText}`))))
          .then((xml) => parseParticleLibrary(xml))
          .catch((err) => {
            console.warn('particle library failed', path, err)
            return null
          }),
      )
    }
    return this.libraries.get(key)
  }

  /**
   * Loads the sprite texture of an effect: the diffuse map of its material, or its texture
   */
  public loadSpriteTexture(texture: string, material: string): Promise<Texture | null> {
    const key = `${texture}|${material}`.toLowerCase()
    if (!this.textures.has(key)) {
      this.textures.set(
        key,
        this.resolveSpriteTexture(texture, material)
          .then((file) => (file ? this.content.loadTexture(`${file}?merge=true&size=${MATERIAL_TEXTURE_SIZE}`) : null))
          .catch((err) => {
            console.warn('particle texture failed', texture, material, err)
            return null
          }),
      )
    }
    return this.textures.get(key)
  }

  private async resolveSpriteTexture(texture: string, material: string): Promise<string | null> {
    const mtl = await this.loadSpriteMtl(material)
    const diffuse = mtl?.textures.find((it) => it.Map === 'Diffuse')
    const result = diffuse ? mtlTextureFile(diffuse) : null
    if (result) {
      return result
    }
    return texture ? mtlTextureFile({ Map: 'Diffuse', File: texture } as any) : null
  }

  private loadSpriteMtl(material: string): Promise<MtlMaterial | null> {
    if (!material) {
      return Promise.resolve(null)
    }
    const file = normalizeAssetPath(/\.mtl$/i.test(material) ? material : `${material}.mtl`)
    if (!this.mtls.has(file)) {
      this.mtls.set(
        file,
        fetch(this.content.nwbtFileUrl + file)
          .then(async (res) => (res.ok ? parseMtl(await res.text()).materials[0] ?? null : null))
          .catch(() => null),
      )
    }
    return this.mtls.get(file)
  }

  /**
   * Diffuse color of a sprite material, the original multiplies the texture with it (USE_MATERIAL in particles.cfi)
   */
  public async loadSpriteDiffuseColor(material: string): Promise<[number, number, number]> {
    const color = (await this.loadSpriteMtl(material))?.attrs.Diffuse
    return color?.length >= 3 ? [color[0], color[1], color[2]] : [1, 1, 1]
  }

  /**
   * Loads the inputs of the %SIGNED_DISTANCE_FIELD_2D feature of a sprite material, null if the material does not use it
   */
  public loadSpriteSdf(material: string): Promise<ParticleSdf2D | null> {
    const key = (material || '').toLowerCase()
    if (!this.sdfs.has(key)) {
      this.sdfs.set(
        key,
        this.resolveSpriteSdf(material).catch((err) => {
          console.warn('particle sdf failed', material, err)
          return null
        }),
      )
    }
    return this.sdfs.get(key)
  }

  private async resolveSpriteSdf(material: string): Promise<ParticleSdf2D | null> {
    const mtl = await this.loadSpriteMtl(material)
    if (!mtl || !/%SIGNED_DISTANCE_FIELD_2D\b/i.test(mtl.attrs.StringGenMask ?? '')) {
      return null
    }
    const textureFile = (map: string) => {
      const tex = mtl.textures.find((it) => it.Map === map)
      return tex ? mtlTextureFile(tex) : null
    }
    const load = (file: string | null) =>
      file ? this.content.loadTexture(`${file}?merge=true&size=${MATERIAL_TEXTURE_SIZE}`) : Promise.resolve(null)
    const [noise, mask] = await Promise.all([load(textureFile('[2] Custom')), load(textureFile('Opacity'))])
    if (!noise || !mask) {
      return null
    }
    const num = (name: string, fallback: number) => {
      const value = Number(mtl.params[name])
      return Number.isFinite(value) ? value : fallback
    }
    const pair = (prefix: string, fallback: number): [number, number] => [
      num(`${prefix}_X`, fallback),
      num(`${prefix}_Y`, fallback),
    ]
    return {
      noise,
      mask,
      strength: num('SDF_2D_STRENGTH', 1),
      tile: pair('SDF_2D_TILE', 1),
      speed: pair('SDF_2D_SPEED', 0),
      phase: pair('SDF_2D_PHASE', 0),
      sourceTile: pair('SOURCE_2D_TILE', 1),
      sourceSpeed: pair('SOURCE_2D_SPEED', 0),
      sourcePhase: pair('SOURCE_2D_PHASE', 0),
      maskTile: pair('SDF_2D_MASK_TILE', 1),
    }
  }

  public destroy(): void {
    this.active.clear()
  }
}

/**
 * A particle effect instance that is updated by the {@link ParticleSystem}
 */
export interface ParticleUpdatable {
  readonly emitterCount: number
  readonly particleCount: number
  updateParticles(dt: number, camera: ParticleCamera): void
}

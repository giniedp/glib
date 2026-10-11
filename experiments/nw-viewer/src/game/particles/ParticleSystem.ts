import { EcsGame } from '@gglib/components'
import { GameSystem, type GameWorld } from '@gglib/ecs'
import type { Texture } from '@gglib/graphics'
import { mat4GetTranslation, vec3, type IVec3 } from '@gglib/math'
import { MATERIAL_TEXTURE_SIZE } from '../../constants'
import { ContentService, normalizeAssetPath } from '../../content'
import { mtlTextureFile, parseMtl } from '../../formats/mtl'
import {
  parseParticleLibrary,
  resolveParticleEffect,
  type ParticleEffect,
  type ParticleLibraryDocument,
} from '../../formats/particles'
import type { ParticleCamera } from './ParticleEmitter'

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

  private loadLibrary(path: string): Promise<ParticleLibraryDocument | null> {
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
    if (material) {
      const file = normalizeAssetPath(/\.mtl$/i.test(material) ? material : `${material}.mtl`)
      const res = await fetch(this.content.nwbtFileUrl + file)
      if (res.ok) {
        const doc = parseMtl(await res.text())
        const diffuse = doc.materials[0]?.textures.find((it) => it.Map === 'Diffuse')
        const result = diffuse ? mtlTextureFile(diffuse) : null
        if (result) {
          return result
        }
      }
    }
    return texture ? mtlTextureFile({ Map: 'Diffuse', File: texture } as any) : null
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

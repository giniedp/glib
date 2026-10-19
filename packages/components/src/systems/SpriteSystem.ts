import { GameEntity, GameQuery, GameSystem, GameWorld } from '@gglib/ecs'
import { SpriteMesh } from '@gglib/effects'
import { Color, Device, SamplerState, Texture } from '@gglib/graphics'
import { IVec4, Mat4 } from '@gglib/math'
import { MeshComponent } from '../components/MeshComponent'
import type { SceneComponent } from '../components/SceneComponent'
import { SpriteComponent } from '../components/SpriteComponent'
import { TransformComponent } from '../components/TransformComponent'
import { buildSpriteQuads, type SpriteQuadSink } from './buildSpriteQuads'
import { EcsGame } from './EcsGame'

/**
 * Constructor options for {@link SpriteSystem}
 *
 * @public
 */
export interface SpriteSystemOptions {
  /**
   * The scene to render into. Defaults to the scene of the {@link EcsGame}
   */
  scene?: SceneComponent
  /**
   * The sampler for the sprite textures. Defaults to `SamplerState.LinearClamp`, use `PointClamp` for pixel art
   */
  sampler?: SamplerState
  /**
   * Pixels with an alpha below this value are discarded. Defaults to `0.5`
   *
   * @remarks
   * Sprites write depth, so they are ordered by depth regardless of their texture. With `0` nothing is discarded
   * and sprites don't write depth, then they only blend in draw order, which is undefined across textures.
   */
  alphaCutoff?: number
}

interface SpriteBatch {
  texture: Texture
  sprites: SpriteMesh
  entity: GameEntity | null
  /**
   * Number of frames this batch had no sprites
   */
  idleFrames: number
}

/**
 * Number of frames after which an unused batch is destroyed
 */
const MAX_IDLE_FRAMES = 60

/**
 * Renders all active {@link SpriteComponent}s
 *
 * @public
 * @remarks
 * Sprites are batched by texture, each batch is a {@link SpriteMesh} that draws all its sprites with one draw call.
 * The meshes are rendered by entities with a {@link MeshComponent} in the scene.
 *
 * The sprites are written in the render step, after all systems have moved the entities. Add the system
 * before the `Renderer`. The `EcsGame` adds it by default.
 */
export class SpriteSystem extends GameSystem {
  private world: GameWorld
  private device: Device
  private options: SpriteSystemOptions
  private batches = new Map<Texture, SpriteBatch>()
  // same batches as an array, iterated without allocations
  private batchList: SpriteBatch[] = []
  private query: GameQuery
  private whiteTexture: Texture | null = null

  // the sink of buildSpriteQuads, writes into the current batch
  private lastTexture: Texture | null = null
  private target: SpriteMesh
  private world4: Mat4
  private color: IVec4
  private sink: SpriteQuadSink = {
    quad: (x0, y0, x1, y1, u0, v0, u1, v1) => {
      this.target.writeQuad(this.world4, x0, y0, x1, y1, u0, v0, u1, v1, this.color)
    },
  }

  public constructor(device: Device, options?: SpriteSystemOptions) {
    super()
    this.device = device
    this.options = options ?? {}
  }

  public override initialize(world: GameWorld): void {
    this.world = world
    this.query = world.query({ scope: 'active', required: [SpriteComponent, TransformComponent] })
  }

  public override destroy(): void {
    while (this.batchList.length) {
      this.removeBatch(this.batchList[0])
    }
    this.whiteTexture?.dispose()
    this.whiteTexture = null
  }

  public override render(): void {
    const list = this.batchList
    for (let i = 0; i < list.length; i++) {
      list[i].sprites.begin()
    }

    this.lastTexture = null
    this.query.forEach(this.writeSprite)

    for (let i = list.length - 1; i >= 0; i--) {
      const batch = list[i]
      batch.sprites.commit()
      const empty = batch.sprites.count === 0
      batch.idleFrames = empty ? batch.idleFrames + 1 : 0
      if (batch.idleFrames > MAX_IDLE_FRAMES) {
        this.removeBatch(batch)
        continue
      }
      batch.entity ??= this.createEntity(batch.sprites)
      if (batch.entity && batch.entity.isActive === empty) {
        if (empty) {
          batch.entity.deactivate()
        } else {
          batch.entity.activate()
        }
      }
    }
  }

  private writeSprite = (entity: GameEntity) => {
    const sprite = entity.component(SpriteComponent)
    const texture = sprite.texture ?? this.getWhiteTexture()
    if (texture !== this.lastTexture) {
      this.lastTexture = texture
      this.target = (this.batches.get(texture) ?? this.createBatch(texture)).sprites
    }
    this.world4 = entity.component(TransformComponent).world
    this.color = sprite.color
    buildSpriteQuads(sprite, texture.width, texture.height, this.sink)
  }

  private createBatch(texture: Texture): SpriteBatch {
    const sprites = new SpriteMesh(this.device)
    sprites.material.ColorMap = texture
    sprites.material.ColorMapSampler = this.options.sampler ?? SamplerState.LinearClamp
    sprites.material.setAlphaCutoff(this.options.alphaCutoff ?? 0.5)
    const batch: SpriteBatch = { texture, sprites, entity: null, idleFrames: 0 }
    this.batches.set(texture, batch)
    this.batchList.push(batch)
    return batch
  }

  private removeBatch(batch: SpriteBatch) {
    this.batches.delete(batch.texture)
    this.batchList.splice(this.batchList.indexOf(batch), 1)
    batch.entity?.destroy()
    batch.sprites.dispose()
  }

  private getWhiteTexture(): Texture {
    this.whiteTexture ??= this.device.createTexture({
      source: Color.toByteArray(Color.White),
      width: 1,
      height: 1,
      format: 'rgba8unorm',
    })
    return this.whiteTexture
  }

  private createEntity(sprites: SpriteMesh): GameEntity | null {
    const scene = this.options.scene ?? this.world.getSystem(EcsGame, { optional: true })?.scene
    if (!scene) {
      return null
    }
    return this.world.createEntity({
      name: 'Sprites',
      parent: scene.entity,
      transform: new TransformComponent(),
      components: [new MeshComponent({ mesh: sprites.mesh })],
    })
  }
}

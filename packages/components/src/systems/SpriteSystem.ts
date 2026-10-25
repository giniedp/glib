import { GameEntity, GameQuery, GameSystem, GameWorld, GetComponent, SystemOrder } from '@gglib/ecs'
import { SpriteMesh } from '@gglib/effects'
import { Color, Device, type Ownable, ResourceOwnership, SamplerState, Texture } from '@gglib/graphics'
import { IVec4, Mat4 } from '@gglib/math'
import { removeItemUnordered } from '@gglib/utils'
import { MeshComponent } from '../components/MeshComponent'
import { SceneComponent } from '../components/SceneComponent'
import { SpriteComponent } from '../components/SpriteComponent'
import { TransformComponent } from '../components/TransformComponent'
import { buildSpriteQuads, type SpriteQuadSink } from './buildSpriteQuads'

/**
 * Constructor options for {@link SpriteSystem}
 *
 * @public
 */
export interface SpriteSystemOptions {
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
 * The batches of one scene
 */
interface SceneSpriteData {
  scene: SceneComponent
  batches: Map<Texture, SpriteBatch>
  list: SpriteBatch[]
}

/**
 * Attaches the {@link SceneSpriteData} of this system to their scene
 */
const dataKey = Symbol('SceneSpriteDataKey')

/**
 * Number of frames after which an unused batch is destroyed
 */
const MAX_IDLE_FRAMES = 60

/**
 * Renders all active {@link SpriteComponent}s
 *
 * @public
 * @remarks
 * Sprites are batched by scene and texture, each batch is a {@link SpriteMesh} that draws all its sprites with one
 * draw call. The meshes are rendered by entities with a {@link MeshComponent}, which are children of the scene entity.
 * A sprite is rendered in the scene of its entity, sprites outside of a scene are not rendered.
 *
 * The sprites are written in the render step of the `SystemOrder.Render` phase, after all systems have moved the
 * entities. The `EcsGame` adds the system by default.
 */
export class SpriteSystem extends GameSystem implements Ownable {
  public override order: number = SystemOrder.Render

  /**
   * Holds the white texture of untextured sprites. The materials of the batches hold it too, a removed batch
   * would otherwise finalize it while the system still hands it out
   */
  public readonly ownership: ResourceOwnership = new ResourceOwnership(this)

  private world: GameWorld
  private device: Device
  private options: SpriteSystemOptions
  private scenes: SceneSpriteData[] = []
  private query: GameQuery
  private whiteTexture: Texture | null = null

  // the sink of buildSpriteQuads, writes into the current batch
  private lastScene: SceneComponent | null = null
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
    while (this.scenes.length) {
      this.removeSceneData(this.scenes[this.scenes.length - 1])
    }
    this.ownership.finalize()
    this.whiteTexture = null
  }

  public override render(): void {
    const scenes = this.scenes
    for (let i = scenes.length - 1; i >= 0; i--) {
      // the batch entities were destroyed with the scene
      if (scenes[i].scene.entity.isDestroyed) {
        this.removeSceneData(scenes[i])
        continue
      }
      const list = scenes[i].list
      for (let j = 0; j < list.length; j++) {
        list[j].sprites.begin()
      }
    }

    this.lastScene = null
    this.lastTexture = null
    for (const entity of this.query) {
      this.writeSprite(entity)
    }

    for (let i = 0; i < scenes.length; i++) {
      this.commitScene(scenes[i])
    }
  }

  private commitScene(data: SceneSpriteData) {
    const list = data.list
    for (let i = list.length - 1; i >= 0; i--) {
      const batch = list[i]
      batch.sprites.commit()
      const empty = batch.sprites.count === 0
      batch.idleFrames = empty ? batch.idleFrames + 1 : 0
      if (batch.idleFrames > MAX_IDLE_FRAMES) {
        this.removeBatch(data, batch)
        continue
      }
      // created here and not while the query is iterated
      batch.entity ??= this.createEntity(data.scene, batch.sprites)
      if (batch.entity.isActive === empty) {
        if (empty) {
          batch.entity.deactivate()
        } else {
          batch.entity.activate()
        }
      }
    }
  }

  private writeSprite(entity: GameEntity) {
    const scene = entity.$(SceneComponent.Member, GetComponent.Optional)?.scene
    if (!scene) {
      return
    }
    const sprite = entity.$(SpriteComponent)
    const texture = sprite.texture ?? this.getWhiteTexture()
    if (texture !== this.lastTexture || scene !== this.lastScene) {
      this.lastScene = scene
      this.lastTexture = texture
      const data = this.getSceneData(scene)
      this.target = (data.batches.get(texture) ?? this.createBatch(data, texture)).sprites
    }
    this.world4 = entity.$(TransformComponent).world
    this.color = sprite.color
    buildSpriteQuads(sprite, texture.width, texture.height, this.sink)
  }

  private getSceneData(scene: SceneComponent): SceneSpriteData {
    let data = scene[dataKey] as SceneSpriteData | undefined
    if (!data) {
      data = { scene, batches: new Map(), list: [] }
      scene[dataKey] = data
      this.scenes.push(data)
    }
    return data
  }

  private removeSceneData(data: SceneSpriteData) {
    while (data.list.length) {
      this.removeBatch(data, data.list[0])
    }
    delete data.scene[dataKey]
    removeItemUnordered(this.scenes, data)
  }

  private createBatch(data: SceneSpriteData, texture: Texture): SpriteBatch {
    const sprites = new SpriteMesh(this.device)
    sprites.material.ColorMap = texture
    sprites.material.ColorMapSampler = this.options.sampler ?? SamplerState.LinearClamp
    sprites.material.setAlphaCutoff(this.options.alphaCutoff ?? 0.5)
    const batch: SpriteBatch = { texture, sprites, entity: null, idleFrames: 0 }
    data.batches.set(texture, batch)
    data.list.push(batch)
    return batch
  }

  private removeBatch(data: SceneSpriteData, batch: SpriteBatch) {
    data.batches.delete(batch.texture)
    data.list.splice(data.list.indexOf(batch), 1)
    batch.entity?.destroy()
    batch.sprites.dispose()
  }

  private getWhiteTexture(): Texture {
    this.whiteTexture ??= this.ownership.adopt(
      this.device.createTexture({
        source: Color.toByteArray(Color.White),
        width: 1,
        height: 1,
        format: 'rgba8unorm',
      }),
    )
    return this.whiteTexture
  }

  private createEntity(scene: SceneComponent, sprites: SpriteMesh): GameEntity {
    return this.world.createEntity({
      name: 'Sprites',
      parent: scene.entity,
      transform: new TransformComponent(),
      components: [new MeshComponent({ mesh: sprites.mesh })],
    })
  }
}

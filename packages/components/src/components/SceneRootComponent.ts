import {
  type GameComponent,
  GameEntity,
  GameQuery,
  GameWorld,
  GetComponent,
  InitializableComponent,
  Type,
} from '@gglib/ecs'
import { BoundingFrustum, Intersection } from '@gglib/math'
import {
  CameraData,
  LayerMask,
  MeshPartRenderItem,
  MeshRenderItem,
  PooledList,
  RenderItem,
  RenderItemFlags,
  RenderItemType,
  RenderScene,
  SpriteRenderItem,
} from '@gglib/render'
import { getSpatialEntries, SpatialNode } from '../spatial'
import { SpatialSystem } from '../systems/SpatialSystem'
import { MeshComponent } from './MeshComponent'
import { MeshPartComponent } from './MeshPartComponent'
import { ModelComponent } from './ModelComponent'
import { SpatialComponent } from './SpatialComponent'
import { SpatialRootComponent } from './SpatialRootComponent'
import { SpriteComponent } from './SpriteComponent'

export class SceneTagComponent implements GameComponent {
  public scene: SceneRootComponent
  public entity: GameEntity
  public initialize(): void {
    this.scene = this.entity.component(SceneRootComponent, GetComponent.OptionalFollowParent)
  }
  public activate(): void {}
  public deactivate(): void {}
  public destroy(): void {}
}

export interface SceneStats {
  meshes: number
  meshParts: number
  sprites: number
  visible: number
}

export class SceneRootComponent implements GameComponent, InitializableComponent, RenderScene {
  public static readonly Tag = SceneTagComponent
  public readonly Tag: Type<SceneTagComponent>
  public readonly entity: GameEntity

  protected qSpatial: GameQuery
  protected qMeshes: GameQuery
  protected qMeshParts: GameQuery
  protected qModels: GameQuery
  protected qSprites: GameQuery

  protected world: GameWorld
  protected meshes = new PooledList<MeshRenderItem>(() => {
    const item: MeshRenderItem = {
      type: RenderItemType.Mesh,
      mesh: null,
      flags: RenderItemFlags.Opaque,
      layer: LayerMask.All,
      transform: null,
    }
    return item
  })

  protected meshParts = new PooledList<MeshPartRenderItem>(() => {
    const item: MeshPartRenderItem = {
      type: RenderItemType.MeshPart,
      meshPart: { geometry: null, material: null },
      flags: RenderItemFlags.Opaque,
      layer: LayerMask.All,
      transform: null,
    }
    return item
  })

  protected sprites = new PooledList<SpriteRenderItem>(() => {
    const item: SpriteRenderItem = {
      type: RenderItemType.Sprite,
      sprite: null,
      flags: RenderItemFlags.Opaque,
      layer: LayerMask.All,
      transform: null,
    }
    return item
  })

  protected initialized = false

  public constructor() {
    this.Tag = class SceneTag extends SceneTagComponent {}
  }

  public initialize(): void {
    this.world = this.entity.world

    const hasSpatial = !!this.world.getSystem(SpatialSystem, { optional: true })
    const rejected = hasSpatial ? [SpatialComponent] : []

    this.qSpatial = this.world.query({ required: [this.Tag, SpatialRootComponent] })
    this.qMeshes = this.world.query({ required: [this.Tag, MeshComponent], rejected: [...rejected] })
    this.qMeshParts = this.world.query({ required: [this.Tag, MeshPartComponent], rejected: [...rejected] })
    this.qModels = this.world.query({ required: [this.Tag, ModelComponent], rejected: [...rejected] })
    this.qSprites = this.world.query({ required: [this.Tag, SpriteComponent], rejected: [...rejected] })

    this.initialized = true
  }

  private collectResult: RenderItem[]
  private frustum = new BoundingFrustum()
  public collect(camera: CameraData, result: RenderItem[]): void {
    if (!this.initialized) {
      console.warn('SceneComponent is not initialized yet. Call collect() after the world has been initialized.')
      return
    }

    this.collectResult = result
    this.frustum.updateFromViewProjection(camera.view, camera.projection)

    // clear pools
    this.meshes.clear()
    this.sprites.clear()
    this.meshParts.clear()

    // traverse all entities that are not baked into the spatial index
    this.qModels.forEach(this.collectModel)
    this.qMeshes.forEach(this.collectMesh)
    this.qMeshParts.forEach(this.collectMeshPart)
    this.qSprites.forEach(this.collectSprite)

    // traverse spatial index for entities
    this.qSpatial.forEach(this.collectSpatial)
  }

  public stats(result?: SceneStats): SceneStats {
    result ||= {} as SceneStats
    result.meshes = this.meshes.size
    result.meshParts = this.meshParts.size
    result.sprites = this.sprites.size
    result.visible = this.collectResult?.length ?? 0
    return result
  }

  private collectSpatial = (entity: GameEntity) => {
    const root = entity.component(SpatialRootComponent)
    root.index.traverseIntersection(this.frustum, Intersection.frustumBox, this.visitNode)
  }

  private visitNode = (node: SpatialNode<any>) => {
    for (const item of getSpatialEntries(node).values) {
      if (item.entity.isActive) {
        this.collectMesh(item.entity)
        this.collectMeshPart(item.entity)
        this.collectModel(item.entity)
        this.collectSprite(item.entity)
      }
    }
  }

  private collectMesh = (entity: GameEntity) => {
    const mesh = entity.component(MeshComponent, GetComponent.Optional)?.mesh
    if (!mesh) {
      return
    }
    for (const part of mesh.parts) {
      const item = this.meshParts.next()
      const material = mesh.getMaterial(part.materialId)
      item.meshPart.geometry = part
      item.meshPart.material = material
      item.transform = entity.getTransform().world
      item.layer = LayerMask.All
      if (material.effect.blendState?.enable) {
        item.flags = RenderItemFlags.Transparent
      } else {
        item.flags = RenderItemFlags.Opaque
      }
      this.collectResult.push(item)
    }
  }

  private collectMeshPart = (entity: GameEntity) => {
    const component = entity.component(MeshPartComponent, GetComponent.Optional)
    const geometry = component?.mesh
    if (!geometry) {
      return
    }
    const item = this.meshParts.next()
    const material = component.material
    item.meshPart.geometry = geometry
    item.meshPart.material = material
    item.transform = entity.getTransform().world
    item.layer = LayerMask.All
    if (material.effect.blendState?.enable) {
      item.flags = RenderItemFlags.Transparent
    } else {
      item.flags = RenderItemFlags.Opaque
    }
    this.collectResult.push(item)
  }

  private collectModel = (entity: GameEntity) => {
    const model = entity.component(ModelComponent, GetComponent.Optional)?.model
    if (!model) {
      return
    }

    const transform = entity.getTransform().world
    for (const mesh of model.meshes) {
      for (const part of mesh.parts) {
        const item = this.meshParts.next()
        const material = mesh.getMaterial(part.materialId)
        item.meshPart.geometry = part
        item.meshPart.material = material
        item.transform = transform
        item.layer = LayerMask.All
        if (material.effect.blendState?.enable) {
          item.flags = RenderItemFlags.Transparent
        } else {
          item.flags = RenderItemFlags.Opaque
        }
        this.collectResult.push(item)
      }
    }
  }

  private collectSprite = (entity: GameEntity) => {
    const sprites = entity.component(SpriteComponent, GetComponent.Optional)?.data
    if (!sprites?.length) {
      return
    }

    for (const sprite of sprites) {
      const item = this.sprites.next()
      item.sprite = sprite
      item.transform = entity.getTransform().world
      item.layer = LayerMask.All
      item.flags = RenderItemFlags.Opaque
      this.collectResult.push(item)
    }
  }
}

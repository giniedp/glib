import {
  type GameComponent,
  GameEntity,
  GameQuery,
  GameWorld,
  GetComponent,
  InitializableComponent,
  Type,
} from '@gglib/ecs'
import { CommonInputs, Mesh, Texture } from '@gglib/graphics'
import { BoundingFrustum, Intersection, IntersectionType, Mat4 } from '@gglib/math'
import {
  CameraData,
  FrameInfo,
  LayerMask,
  mergeLayerMask,
  MeshPartRenderItem,
  PooledList,
  RenderItem,
  RenderItemFlags,
  RenderItemType,
  RenderScene,
  RenderView,
  SpriteRenderItem,
} from '@gglib/render'
import { getSpatialEntries, SpatialNode } from '../spatial'
import { SpatialSystem } from '../systems/SpatialSystem'
import { MeshComponent } from './MeshComponent'
import { ModelComponent } from './ModelComponent'
import { SpatialComponent } from './SpatialComponent'
import { SpatialNodeComponent } from './SpatialNodeComponent'
import { SpriteComponent } from './SpriteComponent'
import { TransformComponent } from './TransformComponent'

export class SceneMemberComponent implements GameComponent {
  public scene: SceneComponent
  public entity: GameEntity
  public initialize(): void {
    this.scene = this.entity.component(SceneComponent, GetComponent.OptionalFollowParent)
  }
  public activate(): void {}
  public deactivate(): void {}
  public destroy(): void {}
}

export interface SceneStats {
  visible: number
}

const modelTransformVersion = Symbol('modelTransformVersion')

export class SceneComponent implements GameComponent, InitializableComponent, RenderScene {
  public static readonly Member = SceneMemberComponent
  public readonly Member: Type<SceneMemberComponent>
  public readonly entity: GameEntity
  public output: Texture | null
  public views: RenderView[] = []

  protected qSpatial: GameQuery
  protected qMeshes: GameQuery
  protected qMeshParts: GameQuery
  protected qModels: GameQuery
  protected qSprites: GameQuery

  protected world: GameWorld

  protected meshParts = new PooledList<MeshPartRenderItem>(() => {
    const item: MeshPartRenderItem = {
      type: RenderItemType.MeshPart,
      data: { geometry: null, material: null },
      flags: RenderItemFlags.Opaque,
      layer: LayerMask.All,
      transform: null,
    }
    return item
  })

  protected sprites = new PooledList<SpriteRenderItem>(() => {
    const item: SpriteRenderItem = {
      type: RenderItemType.Sprite,
      data: null,
      flags: RenderItemFlags.Opaque,
      layer: LayerMask.All,
      transform: null,
    }
    return item
  })

  protected initialized = false

  public constructor(options?: { views?: RenderView[] }) {
    this.Member = class SceneTag extends SceneMemberComponent {}
    if (options?.views) {
      this.views.push(...options.views)
    }
  }

  public initialize(): void {
    this.world = this.entity.world

    const hasSpatial = !!this.world.getSystem(SpatialSystem, { optional: true })
    const rejected = hasSpatial ? [SpatialNodeComponent] : []

    this.qSpatial = this.world.query({ scope: 'active', required: [this.Member, SpatialComponent] })
    this.qMeshes = this.world.query({
      scope: 'active',
      required: [this.Member, MeshComponent],
      rejected: [...rejected],
    })
    this.qModels = this.world.query({
      scope: 'active',
      required: [this.Member, ModelComponent],
      rejected: [...rejected],
    })
    this.qSprites = this.world.query({
      scope: 'active',
      required: [this.Member, SpriteComponent],
      rejected: [...rejected],
    })

    this.initialized = true
  }

  private collectResult: RenderItem[]
  private frustum = new BoundingFrustum()
  private frame: FrameInfo
  private visibilityMask: number
  public collect(frame: FrameInfo, camera: CameraData, result: RenderItem[]): void {
    this.visibilityMask = camera.visibilityMask ?? LayerMask.All

    if (!this.initialized) {
      console.warn('SceneComponent is not initialized yet. Call collect() after the world has been initialized.')
      return
    }

    this.frame = frame
    this.collectResult = result
    this.frustum.updateFromViewProjection(camera.view, camera.projection)

    // clear pools
    this.sprites.clear()
    this.meshParts.clear()

    // traverse all entities that are not baked into the spatial index
    this.qModels.forEach(this.collectModel)
    this.qMeshes.forEach(this.collectMesh)
    this.qSprites.forEach(this.collectSprite)

    // traverse spatial index for entities
    this.qSpatial.forEach(this.collectSpatial)
  }

  public stats(result?: SceneStats): SceneStats {
    result ||= {} as SceneStats
    result.visible = this.collectResult?.length ?? 0
    return result
  }

  private collectSpatial = (entity: GameEntity) => {
    const root = entity.component(SpatialComponent)
    root.index.traverseIntersection(this.frustum, Intersection.frustumBox, this.visitNode)
  }

  private visitNode = (node: SpatialNode<any>, intersection: IntersectionType) => {
    for (const item of getSpatialEntries(node).values) {
      if (intersection === IntersectionType.Intersects) {
        if (!this.frustum.intersectsSphere(item.sphere)) {
          continue
        }
      }

      this.collectMesh(item.entity)
      this.collectModel(item.entity)
      this.collectSprite(item.entity)
    }
  }

  private collectMesh = (entity: GameEntity) => {
    const comp = entity.component(MeshComponent, GetComponent.Optional)
    if (!comp?.mesh) {
      return
    }

    const mesh: Mesh = comp?.mesh
    const transform = entity.getTransform<TransformComponent>()
    if (comp.version !== comp['cache']) {
      comp['cache'] = comp.version
      comp['cacheItems'] ||= []
      comp['cacheItems'].length = 0
      this.pushMesh(entity, mesh, transform.world, comp['cacheItems'])
    }

    for (const item of comp['cacheItems'] as MeshPartRenderItem[]) {
      const material = item.data.material
      material.setInput(CommonInputs.Object.ModelMatrix, transform.world)
      if (material.update) {
        material.update(this.frame.time, this.frame.delta, this.frame.id)
      }
      if (item.layer & this.visibilityMask) {
        this.collectResult.push(item)
      }
    }

    // this.pushMesh(entity, mesh, transform.world, this.collectResult)
  }

  private collectModel = (entity: GameEntity) => {
    const comp = entity.component(ModelComponent, GetComponent.Optional)
    if (!comp?.model) {
      return
    }

    const model = comp.model
    const transform = entity.getTransform<TransformComponent>()
    if (model[modelTransformVersion] !== transform.version) {
      model[modelTransformVersion] = transform.version
      model.update(transform.world)
    }

    if (comp.version !== comp['cache']) {
      comp['cache'] = comp.version
      comp['cacheItems'] ||= []
      comp['cacheItems'].length = 0

      for (const node of model.sceneNodes) {
        const mesh = model.meshes[node.data.mesh]
        if (mesh) {
          this.pushMesh(entity, mesh, node.world, comp['cacheItems'])
        }
      }
    }

    for (const item of comp['cacheItems'] as MeshPartRenderItem[]) {
      const material = item.data.material

      material.setInput(CommonInputs.Object.ModelMatrix, item.transform)
      if (material.update) {
        material.update(this.frame.time, this.frame.delta, this.frame.id)
      }
      if (item.layer & this.visibilityMask) {
        this.collectResult.push(item)
      }
    }
  }

  private pushMesh(entity: GameEntity, mesh: Mesh, transform: Mat4, out: RenderItem[]) {
    for (const part of mesh.parts) {
      // const item = this.meshParts.next()
      const item: MeshPartRenderItem = {
        type: RenderItemType.MeshPart,
        data: { geometry: null, material: null },
        flags: RenderItemFlags.Opaque,
        layer: LayerMask.All,
        transform: null,
      }
      const geometry = mesh.geometries[part.geometryIndex]
      const material = mesh.materials[part.materialIndex]
      if (material.noRender) {
        continue
      }

      const layer = mergeLayerMask(entity.layer, material.layer) ?? LayerMask.All
      if (!(layer & this.visibilityMask)) {
        continue
      }

      material.setInput(CommonInputs.Object.ModelMatrix, transform)
      if (material.update) {
        material.update(this.frame.time, this.frame.delta, this.frame.id)
      }

      item.data.geometry = geometry
      item.data.material = material
      item.transform = transform
      item.layer = layer

      if (material.isTransparent) {
        item.flags = RenderItemFlags.Transparent
      } else {
        item.flags = RenderItemFlags.Opaque
      }

      out.push(item)
    }
  }

  private collectSprite = (entity: GameEntity) => {
    const sprites = entity.component(SpriteComponent, GetComponent.Optional)?.data
    if (!sprites?.length) {
      return
    }

    const layer = mergeLayerMask(entity.layer) ?? LayerMask.All
    if (!(layer & this.visibilityMask)) {
      return
    }

    for (const sprite of sprites) {
      const item = this.sprites.next()
      item.data = sprite
      item.transform = entity.getTransform().world
      item.layer = layer
      item.flags = RenderItemFlags.Opaque
      this.collectResult.push(item)
    }
  }
}

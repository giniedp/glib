import {
  type GameComponent,
  GameEntity,
  GameQuery,
  GameWorld,
  GetComponent,
  InitializableComponent,
  Type,
} from '@gglib/ecs'
import { CommonInputs, Material, Mesh, Texture } from '@gglib/graphics'
import {
  BoundingBox,
  BoundingFrustum,
  BoundingSphere,
  Intersection,
  IntersectionType,
  type IVec3,
  Mat4,
  mat4GetTranslation,
  vec3,
  vec3Distance,
} from '@gglib/math'
import type { Model } from '@gglib/model'
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

/**
 * Adds render items to a scene that are not collected from its entities, e.g. items culled elsewhere
 */
export interface SceneSource {
  /**
   * Called at the end of {@link SceneComponent.collect}, once per view
   */
  collect(frame: FrameInfo, camera: CameraData, result: RenderItem[], scene: SceneComponent): void
}

const modelTransformVersion = Symbol('modelTransformVersion')
const materialIsInstanced = Symbol('materialIsInstanced')
const materialUpdateFrame = Symbol('materialUpdateFrame')

export class SceneComponent implements GameComponent, InitializableComponent, RenderScene {
  public static readonly Member = SceneMemberComponent
  public readonly Member: Type<SceneMemberComponent>
  public readonly entity: GameEntity
  public output: Texture | null
  public views: RenderView[] = []
  /**
   * Additional sources of render items, see {@link SceneSource}
   */
  public readonly sources: SceneSource[] = []

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

  public setCamera(view: number, camera: CameraData | null) {
    if (!this.views[view]) {
      throw new Error(`No view exist at index ${view}`)
    }
    this.views[view].camera = camera
  }

  public getCamera<T extends CameraData>(view: number): T {
    if (!this.views[view]) {
      throw new Error(`No view exist at index ${view}`)
    }
    return this.views[view].camera as T
  }

  public getView(view: number) {
    if (!this.views[view]) {
      throw new Error(`No view exist at index ${view}`)
    }
    return this.views[view]
  }

  public setView(index: number, view: RenderView) {
    this.views[index] = view
  }

  private collectResult: RenderItem[]
  private frustum = new BoundingFrustum()
  private cameraPosition = vec3()
  private projectionScaleY = 1
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
    mat4GetTranslation(camera.world, this.cameraPosition)
    this.projectionScaleY = camera.projection[5]

    // clear pools
    this.sprites.clear()
    this.meshParts.clear()

    // traverse all entities that are not baked into the spatial index
    this.qModels.forEach(this.collectModel)
    this.qMeshes.forEach(this.collectMesh)
    this.qSprites.forEach(this.collectSprite)

    // traverse spatial index for entities
    this.qSpatial.forEach(this.collectSpatial)

    for (const source of this.sources) {
      source.collect(frame, camera, result, this)
    }
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
      this.pushMesh(entity, mesh, transform.world, comp['cacheItems'], comp.instanceData)
    }

    for (const item of comp['cacheItems'] as MeshPartRenderItem[]) {
      const material = item.data.material
      this.updateMaterial(material, transform.world)
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

    const transform = entity.getTransform<TransformComponent>()
    updateModelTransform(comp.model, transform)

    // the base model decides the level by its bounds, the level model is rendered
    const model = this.selectLodModel(comp)
    updateModelTransform(model, transform)

    if (comp.version !== comp['cache'] || model !== comp['cacheModel']) {
      comp['cache'] = comp.version
      comp['cacheModel'] = model
      comp['cacheItems'] ||= []
      comp['cacheItems'].length = 0

      for (const node of model.sceneNodes) {
        const mesh = model.meshes[node.data.mesh]
        if (!mesh) {
          continue
        }
        const skeleton = model.getSkeleton(node.data)
        if (!skeleton) {
          this.pushMesh(entity, mesh, node.world, comp['cacheItems'], comp.instanceData)
          continue
        }
        // the node transform does not apply to skinned meshes, the joint matrices are relative to the model root.
        // Joints are per object inputs on the material, like the model matrix: each skinned mesh needs its own materials
        for (const material of mesh.materials) {
          material.setInput(CommonInputs.Skin.Joints, skeleton.buffer)
        }
        this.pushMesh(entity, mesh, model.rootWorld, comp['cacheItems'], comp.instanceData)
      }
    }

    for (const item of comp['cacheItems'] as MeshPartRenderItem[]) {
      const material = item.data.material
      this.updateMaterial(material, item.transform)
      if (item.layer & this.visibilityMask) {
        this.collectResult.push(item)
      }
    }
  }

  /**
   * Selects the level of detail of a model by the distance from the camera to its bounds
   *
   * @returns the model to render, the component model if it has no levels of detail
   */
  private selectLodModel(comp: ModelComponent): Model {
    const lod = comp.model.lod
    if (!lod) {
      return comp.model
    }
    const distance = distanceToBox(this.cameraPosition, comp.model.boundingBox)
    const screenSize = this.getScreenSize(comp.model.boundingSphere)
    comp.lodSelected = lod.select(distance, screenSize, comp.lodSelected)
    comp.lodRendered = lod.resolve(comp.lodSelected)
    return lod.getModel(comp.lodRendered)
  }

  /**
   * Size of a sphere on screen, as a fraction of the screen height (perspective projection)
   */
  private getScreenSize(sphere: BoundingSphere): number {
    const distance = vec3Distance(this.cameraPosition, sphere.center)
    if (distance <= sphere.radius) {
      return Number.POSITIVE_INFINITY
    }
    // projection[5] is 1 / tan(fovY / 2), the visible height at the distance is 2 * distance / projection[5]
    return (sphere.radius * this.projectionScaleY) / distance
  }

  private pushMesh(
    entity: GameEntity,
    mesh: Mesh,
    transform: Mat4,
    out: RenderItem[],
    instance?: Float32Array<ArrayBuffer> | null,
  ) {
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

      // an entity layer overrides the material layer, so entities can be hidden or shown as a group
      // items are cached for all layers, the visibility mask is applied per frame when collecting
      const layer = entity.layer ?? material.layer ?? LayerMask.All

      this.updateMaterial(material, transform)

      item.data.geometry = geometry
      item.data.material = material
      item.transform = transform
      item.layer = layer
      item.instance = instance

      if (material.isTransparent) {
        item.flags = RenderItemFlags.Transparent
      } else {
        item.flags = RenderItemFlags.Opaque
      }

      out.push(item)
    }
  }

  /**
   * Updates the per object inputs of a material and calls its per frame update.
   *
   * @remarks
   * Materials whose effect reads transforms from the per instance buffer don't need the model matrix input.
   * Setting it anyway would invalidate the input block every frame and cause all material inputs to be re-applied.
   * The per frame update runs once per frame, even if the material is shared by many items.
   * Sources call it for the materials of their items, see {@link SceneSource}.
   */
  public updateMaterial(material: Material, transform: Mat4) {
    let isInstanced = material[materialIsInstanced] as boolean | undefined
    if (isInstanced === undefined) {
      const effect = material.effect
      if (effect) {
        isInstanced = !!effect.program.perInstanceTransformBlock
        material[materialIsInstanced] = isInstanced
      }
    }
    if (!isInstanced) {
      material.setInput(CommonInputs.Object.ModelMatrix, transform)
    }
    if (material.update && material[materialUpdateFrame] !== this.frame.id) {
      material[materialUpdateFrame] = this.frame.id
      material.update(this.frame.time, this.frame.delta, this.frame.id)
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

/**
 * Updates the node transforms and bounds of a model, if the entity transform or a node (e.g. by animation) changed since the last update
 */
function updateModelTransform(model: Model, transform: TransformComponent) {
  // TODO: the bounds of an animated model change with its pose, but the BoundsComponent receives
  // the model bounds only when the model is assigned (see ModelComponent), culling uses the bind pose bounds
  if (model[modelTransformVersion] !== transform.version || model.needsUpdate) {
    model[modelTransformVersion] = transform.version
    model.update(transform.world)
  }
}

/**
 * Distance from a point to the closest point of a box, 0 if the point is inside
 */
function distanceToBox(point: IVec3, box: BoundingBox): number {
  const dx = Math.max(box.min.x - point.x, 0, point.x - box.max.x)
  const dy = Math.max(box.min.y - point.y, 0, point.y - box.max.y)
  const dz = Math.max(box.min.z - point.z, 0, point.z - box.max.z)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

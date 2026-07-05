import { BoundsComponent, LifeCycleFlags, TransformComponent } from '@gglib/components'
import {
  GetComponent,
  type ActivatableComponent,
  type CreateEntityOptions,
  type GameComponent,
  type GameEntity,
} from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import { BoundingBox, BoundingSphere, DEGREE_TO_RAD, Mat4, vec3, Vec3, type IVec3 } from '@gglib/math'
import {
  isTimeOfDayComponent,
  isViewerLightComponent,
  isViewerMeshComponent,
  isViewerPointSpawnerComponent,
  isViewerPrefabSpawnerComponent,
  type AssetReference,
  type CapitalRuntimeData,
  type ChunkRuntimeData,
  type ViewerSlice,
} from '../../api'
import { ContentService } from '../../content'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import { TimeOfDayComponent } from '../level/TimeOfDayComponent'
import { MeshLoaderComponent } from './MeshLoaderComponent'

export interface SliceSpawnerComponentOptions {
  isChunk?: boolean
  slice: AssetReference
}

export function capitalSliceEntityOPtions(parent: GameEntity, data: CapitalRuntimeData): CreateEntityOptions {
  return {
    name: data.slice.hint,
    parent,
    transform: new TransformComponent({
      keepWorld: true,
      world: Mat4.createFromArray(data.transform),
      lifeCycle: LifeCycleFlags.Propagate, // is controlled by SliceSystem
    }),
    components: [
      new DebugShapeComponent({
        type: 'bounds-sphere',
        color: { x: 1, y: 0, z: 0 },
        layer: DebugLayer.Slice,
      }),
      new BoundsComponent({
        sphere: BoundingSphere.create(0, 0, 0, data.radius),
      }),
      new SliceSpawnerComponent({
        slice: data.slice,
      }),
    ],
  }
}

export function chunkSliceEntityOptions(parent: GameEntity, data: ChunkRuntimeData): CreateEntityOptions {
  return {
    name: data.slice.hint,
    parent,
    transform: new TransformComponent({
      keepWorld: true,
      world: Mat4.createFromArray(data.transform),
      lifeCycle: LifeCycleFlags.Propagate, // is controlled by SliceSystem
    }),
    components: [
      new DebugShapeComponent({
        type: 'bounds-box',
        color: { x: 1, y: 1, z: 0 },
        layer: DebugLayer.Slice,
      }),
      new BoundsComponent({
        box: BoundingBox.create(0, 0, 0, data.size, data.size, data.size),
      }),
      new SliceSpawnerComponent({
        isChunk: true,
        slice: data.slice,
      }),
    ],
  }
}

export class SliceSpawnerComponent implements GameComponent, ActivatableComponent {
  public entity: GameEntity
  public slice: AssetReference
  private content: ContentService
  private bounds: BoundsComponent

  private rangeActivatable: Array<{
    entity: GameEntity
    transform: TransformComponent
    bounds: BoundsComponent
    range: number
    rangeSq: number
  }> = []

  public data: ViewerSlice
  public spawnRadius: number
  public isLoaded: boolean
  public isSpawned: boolean
  private isChunk: boolean
  public readonly slices: SliceSpawnerComponent[] = []
  public constructor(data: SliceSpawnerComponentOptions) {
    this.slice = data.slice
    this.isChunk = !!data.isChunk
    this.spawnRadius = 0
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.bounds = this.entity.component(BoundsComponent)
  }

  public activate(): void {
    //
  }

  public load() {
    if (this.data) {
      return
    }
    this.isLoaded = true
    const assetKey = `${this.slice.guid}_${this.slice.subId}`
    this.data = this.content.slices.get(assetKey)
    if (!this.data) {
      console.warn(`Slice data not found for ${assetKey}`)
      return
    }

    this.spawnRadius = this.data.spawnRadius
    if (this.isChunk) {
      this.spawnRadius = Math.max(this.spawnRadius, 128 * 3)
    }
    this.bounds.setLocalBounds(BoundingSphere.create(0, 0, 0, this.spawnRadius), null)
  }

  public unload() {
    //
  }

  public spawn() {
    if (this.isSpawned || !this.isLoaded) {
      return
    }
    this.isSpawned = true
    // const dbugger = this.entity.component(DebugShapeComponent, GetComponent.Optional)
    // if (dbugger) {
    //   dbugger.color.x = 0
    //   dbugger.color.y = 1
    //   dbugger.color.z = 0
    // }

    if (!this.data.entities?.length) {
      return
    }

    const parentWorld = this.entity.getTransform().world
    for (const item of this.data.entities) {
      let range = 0
      const debug = new DebugShapeComponent()
      const components: GameComponent[] = [debug]

      for (const comp of item.components) {
        if (isViewerMeshComponent(comp)) {
          components.push(new MeshLoaderComponent(comp))
          range = Math.max(range, comp.maxViewDistance * comp.viewDistanceMultiplier)
          continue
        }
        if (isViewerPrefabSpawnerComponent(comp)) {
          debug.add({
            type: 'bounds-sphere',
            color: Vec3.createFrom(Color.Yellow),
            layer: DebugLayer.Slice,
          })

          components.push(
            new BoundsComponent(),
            new SliceSpawnerComponent({
              slice: comp.slice,
            }),
          )
          continue
        }
        if (isViewerPointSpawnerComponent(comp)) {
          debug.add({
            type: 'bounds-sphere',
            color: Vec3.createFrom(Color.Azure),
            layer: DebugLayer.Slice,
          })
          components.push(
            new BoundsComponent(),
            new SliceSpawnerComponent({
              slice: comp.slice,
            }),
          )
          continue
        }
        if (isTimeOfDayComponent(comp)) {
          console.log('TimeOfDayComponent', comp)
          const shape = debug.add({
            type: 'box',
            color: vec3((comp.priority ?? 1) / 10),
            alpha: 0.125,
            layer: DebugLayer.TimeOfDay,
            solid: true,
          })
          if (comp.shape === 'box') {
            shape.type = 'box'
            shape.transforms = [Mat4.createScaleXYZ(comp.width, comp.depth, comp.height)]
            components.push(new TimeOfDayComponent(comp))
          } else if (comp.shape === 'sphere') {
            shape.type = 'sphere'
            shape.transforms = [Mat4.createScaleUniform(comp.radius)]
            components.push(new TimeOfDayComponent(comp))
          } else if (comp.shape === 'cylinder') {
            shape.type = 'cylinder'
            shape.transforms = [Mat4.createScaleXYZ(comp.radius, comp.radius, comp.height)]
            components.push(new TimeOfDayComponent(comp))
          } else {
            console.warn('Unknown TimeOfDay shape', comp.shape)
          }
          continue
        }
        if (isViewerLightComponent(comp)) {
          const light = comp.light
          switch (light.type) {
            case 'Point': {
              if (light.viewDistanceEnabled) {
                range = Math.max(range, light.maxViewDistance * light.viewDistanceMultiplier)
              }
              debug.add({
                type: 'bounds-sphere',
                color: vec3(light.color),
                alpha: 0.125,
                solid: true,
                layer: DebugLayer.Light,
              })
              components.push(
                new BoundsComponent({
                  sphere: BoundingSphere.create(0, 0, 0, light.range),
                }),
              )
              break
            }
            case 'Area': {
              if (light.viewDistanceEnabled) {
                range = Math.max(range, light.maxViewDistance * light.viewDistanceMultiplier)
              }
              debug.add({
                type: 'bounds-box',
                color: vec3(light.color),
                alpha: 0.125,
                solid: true,
                layer: DebugLayer.Light,
                // instances: [Mat4.createScaleXYZ(light.areaWidth, light.areaHeight, light.range)],
              })
              components.push(
                new BoundsComponent({
                  box: BoundingBox.create(
                    -light.areaWidth * 0.5,
                    -light.areaHeight * 0.5,
                    0,
                    light.areaWidth * 0.5,
                    light.areaHeight * 0.5,
                    light.range,
                  ),
                }),
              )
              break
            }
            case 'Projector': {
              if (light.viewDistanceEnabled) {
                range = Math.max(range, light.maxViewDistance * light.viewDistanceMultiplier)
              }

              const proj = Mat4.createPerspectiveFieldOfView(light.projectorFOV * DEGREE_TO_RAD, 1, 0.1, light.range, 0)
                .rotateZ(90 * DEGREE_TO_RAD)
                .rotateY(90 * DEGREE_TO_RAD)
                .invert()
                .scaleUniform(2.0)

              debug.add({
                type: 'box',
                color: vec3(light.color),
                alpha: 0.125,
                solid: true,
                layer: DebugLayer.Light,
                instances: [proj],
              })

              break
            }
            case 'Probe': {
              if (light.viewDistanceEnabled) {
                range = Math.max(range, light.maxViewDistance * light.viewDistanceMultiplier)
              }
              debug.add({
                type: 'bounds-box',
                color: vec3(light.color),
                alpha: 0.125,
                solid: true,
                layer: DebugLayer.Light,
              })
              components.push(
                new BoundsComponent({
                  box: BoundingBox.create(
                    -light.boxWidth,
                    -light.boxHeight,
                    -light.boxDepth,
                    light.boxWidth,
                    light.boxHeight,
                    light.boxDepth,
                  ),
                }),
              )
              break
            }
          }
          continue
        }
        console.log('Component not implemented', comp)
      }

      const entity = this.entity.world.createEntity({
        parent: this.entity,
        name: item.name,
        components,
        transform: new TransformComponent({
          keepWorld: true,
          world: Mat4.createFromArray(item.transform).premultiply(parentWorld),
          lifeCycle: range ? LifeCycleFlags.Propagate : LifeCycleFlags.Full,
        }),
      })

      if (range) {
        this.rangeActivatable.push({
          entity,
          range,
          rangeSq: range * range,
          transform: entity.getTransform<TransformComponent>(),
          bounds: entity.component(BoundsComponent, GetComponent.Optional),
        })
      }

      const spawner = entity.component(SliceSpawnerComponent, GetComponent.Optional)
      if (spawner) {
        this.slices.push(spawner)
      }
    }
  }

  // TODO: optimize range update without iterating all entities every frame
  private bucketSize = 50
  private bucket = 0
  public updateRanges(camera: IVec3) {
    const start = this.bucket * this.bucketSize
    const end = Math.min(start + this.bucketSize, this.rangeActivatable.length)
    const bucketCount = Math.ceil(this.rangeActivatable.length / this.bucketSize)
    this.bucket = (this.bucket + 1) % bucketCount

    for (let i = start; i < end; i++) {
      const item = this.rangeActivatable[i]
      const isInRange = Vec3.distanceSquared(item.transform.world.translation, camera) <= item.rangeSq

      if (isInRange && !item.entity.isActive) {
        if (item.entity.canInitialize) {
          item.entity.initialize()
        }
        if (item.entity.canActivate) {
          item.entity.activate()
        }
      } else if (!isInRange && item.entity.isActive) {
        if (item.entity.canDeactivate) {
          item.entity.deactivate()
        }
      }
    }
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    //
  }
}

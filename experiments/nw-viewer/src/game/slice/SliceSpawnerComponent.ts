import { BoundsComponent, LifeCycleFlags, TransformComponent } from '@gglib/components'
import {
  GetComponent,
  type ActivatableComponent,
  type CreateEntityOptions,
  type GameComponent,
  type GameEntity,
} from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import {
  BoundingBox,
  BoundingSphere,
  DEGREE_TO_RAD,
  mat4$invert,
  mat4$premultiply,
  mat4$rotateY,
  mat4$rotateZ,
  mat4$scaleUniform,
  mat4CreateFromArray,
  mat4CreatePerspectiveFieldOfView,
  mat4CreateScaleUniform,
  mat4CreateScaleXYZ,
  mat4GetTranslation,
  mat4Invert,
  mat4Multiply,
  vec3,
  vec3Copy,
} from '@gglib/math'
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
import { CHUNK_MESH_RANGE, IMPOSTOR_HOLD_CHUNK_SIZES } from '../../constants'
import { ContentService } from '../../content'
import { MaterialLayerMasks } from '../../material'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import { TimeOfDayComponent } from '../level/TimeOfDayComponent'
import { LightComponent } from '../light/LightComponent'
import type { RegionImpostorComponent } from '../region/RegionImpostorComponent'
import { MeshLoaderComponent } from './MeshLoaderComponent'
import { RangeActivationSystem } from './RangeActivationSystem'

export interface SliceSpawnerComponentOptions {
  isChunk?: boolean
  /**
   * Size of the chunk, if this is a chunk slice
   */
  chunkSize?: number
  /**
   * Impostor cell that spawns this chunk and activates its mesh entities
   */
  cell?: RegionImpostorComponent | null
  slice: AssetReference
}

export function capitalSliceEntityOptions(parent: GameEntity, data: CapitalRuntimeData): CreateEntityOptions {
  return {
    name: data.slice.hint,
    parent,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateFromArray(data.transform),
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

export function chunkSliceEntityOptions(
  parent: GameEntity,
  data: ChunkRuntimeData,
  cell: RegionImpostorComponent | null,
): CreateEntityOptions {
  const spawner = new SliceSpawnerComponent({
    isChunk: true,
    chunkSize: data.size,
    cell,
    slice: data.slice,
  })
  const debug = new DebugShapeComponent({
    type: 'bounds-box',
    color: { x: 1, y: 1, z: 0 },
    layer: DebugLayer.Slice,
  })

  const half = data.size * 0.5
  return {
    name: data.slice.hint,
    parent,
    transform: new TransformComponent({
      keepWorld: true,
      world: mat4CreateFromArray(data.transform),
      lifeCycle: LifeCycleFlags.Propagate, // is controlled by SliceSystem
    }),
    components: [
      debug,
      new BoundsComponent({
        // chunk position is the cell center
        box: BoundingBox.create(-half, -half, -half, half, half, half),
      }),
      spawner,
    ],
  }
}

export class SliceSpawnerComponent implements GameComponent, ActivatableComponent {
  public entity: GameEntity
  public slice: AssetReference
  private content: ContentService
  private bounds: BoundsComponent
  private rangeSystem: RangeActivationSystem
  private rangeEntities: GameEntity[] = []

  public data: ViewerSlice
  public spawnRadius: number
  public isLoaded: boolean
  public isSpawned: boolean
  private isChunk: boolean
  private chunkSize: number
  /**
   * Impostor cell that spawns this chunk, the SliceSystem does not spawn it by distance
   */
  public readonly impostor: RegionImpostorComponent | null
  public readonly slices: SliceSpawnerComponent[] = []
  public constructor(data: SliceSpawnerComponentOptions) {
    this.slice = data.slice
    this.isChunk = !!data.isChunk
    this.chunkSize = data.chunkSize ?? 0
    this.impostor = data.cell ?? null
    this.spawnRadius = 0
  }

  public initialize(): void {
    this.content = this.entity.service(ContentService)
    this.bounds = this.entity.component(BoundsComponent)
    this.rangeSystem = this.entity.world.getSystem(RangeActivationSystem)
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
    if (!this.data) {
      return
    }
    // const dbugger = this.entity.component(DebugShapeComponent, GetComponent.Optional)
    // if (dbugger) {
    //   dbugger.color.x = 0
    //   dbugger.color.y = 1
    //   dbugger.color.z = 0
    // }

    if (!this.data.entities?.length) {
      return
    }

    let parentWorld = this.entity.getTransform().world
    if (this.data.transform) {
      // The slice root entity has its own transform (data.transform), e.g. a rotation.
      // Entity transforms are stored relative to the slice origin, not relative to the root.
      // The spawner places the root, not the origin. So we first undo the root transform
      // (multiply by its inverse), then apply the spawner transform:
      //   entityWorld = spawnerWorld * inverse(rootTransform) * entityTransform
      // mat4Multiply returns a new matrix, the spawner world is not modified.
      parentWorld = mat4Multiply(parentWorld, mat4Invert(mat4CreateFromArray(this.data.transform)))
    }

    for (const item of this.data.entities) {
      // entities of an inactive spawner (nested slice) are inactive as well
      const inactive = !!item.inactive || this.entity.layer === MaterialLayerMasks.Inactive
      let range = 0

      const debug = new DebugShapeComponent()
      const components: GameComponent[] = [debug]
      const loaders: MeshLoaderComponent[] = []

      for (const comp of item.components) {
        if (isViewerMeshComponent(comp)) {
          const loader = new MeshLoaderComponent(comp)
          loaders.push(loader)
          components.push(loader)
          let meshRange = comp.maxViewDistance * comp.viewDistanceMultiplier
          if (this.isChunk) {
            meshRange = Math.min(meshRange, CHUNK_MESH_RANGE)
          }
          range = Math.max(range, meshRange)
          continue
        }
        if (isViewerPrefabSpawnerComponent(comp)) {
          debug.add({
            type: 'bounds-sphere',
            color: vec3Copy(Color.Yellow),
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
            color: vec3Copy(Color.Azure),
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
            shape.transforms = [mat4CreateScaleXYZ(comp.width, comp.depth, comp.height)]
            components.push(new TimeOfDayComponent(comp))
          } else if (comp.shape === 'sphere') {
            shape.type = 'sphere'
            shape.transforms = [mat4CreateScaleUniform(comp.radius)]
            components.push(new TimeOfDayComponent(comp))
          } else if (comp.shape === 'cylinder') {
            shape.type = 'cylinder'
            shape.transforms = [mat4CreateScaleXYZ(comp.radius, comp.radius, comp.height)]
            components.push(new TimeOfDayComponent(comp))
          } else {
            console.warn('Unknown TimeOfDay shape', comp.shape)
          }
          continue
        }
        if (isViewerLightComponent(comp)) {
          if (inactive) {
            // lights are not filtered by layers, an inactive light would always shine
            continue
          }
          const light = comp.light
          switch (light.type) {
            case 'Point': {
              if (light.viewDistanceEnabled) {
                range = Math.max(range, light.maxViewDistance)
              }
              debug.add({
                type: 'sphere',
                color: vec3(light.color),
                alpha: 0.125,
                solid: true,
                layer: DebugLayer.LightPoint,
                instances: [mat4CreateScaleUniform(light.range)],
              })
              components.push(new LightComponent(light))
              break
            }
            case 'Area': {
              if (light.viewDistanceEnabled) {
                range = Math.max(range, light.maxViewDistance)
              }
              debug.add({
                type: 'box',
                color: vec3(light.color),
                alpha: 0.125,
                solid: true,
                layer: DebugLayer.LightArea,
                instances: [mat4CreateScaleXYZ(light.areaWidth * 0.5, light.areaHeight * 0.5, light.range * 0.5)],
              })
              components.push(new LightComponent(light))
              break
            }
            case 'Projector': {
              if (light.viewDistanceEnabled) {
                range = Math.max(range, light.maxViewDistance)
              }

              const proj = mat4CreatePerspectiveFieldOfView(
                light.projectorFOV * DEGREE_TO_RAD,
                1,
                Math.max(0.001, light.projectorNearPlane),
                light.range,
                0,
              )
              mat4$rotateZ(proj, 90 * DEGREE_TO_RAD)
              mat4$rotateY(proj, 90 * DEGREE_TO_RAD)
              mat4$invert(proj)
              mat4$scaleUniform(proj, 2.0)

              debug.add({
                type: 'box',
                color: vec3(light.color),
                alpha: 0.125,
                solid: true,
                layer: DebugLayer.LightSpot,
                instances: [proj],
              })
              components.push(new LightComponent(light))
              break
            }
            case 'Probe': {
              if (light.viewDistanceEnabled) {
                range = Math.max(range, light.maxViewDistance)
              }
              debug.add({
                type: 'bounds-box',
                color: vec3(light.color),
                alpha: 0.125,
                solid: true,
                layer: DebugLayer.LightProbe,
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

      // Mesh entities of cell owned chunks that hold the impostor are activated by the cell, as a group.
      // Everything else keeps its own range, the small chunks hold most of the props with short view distances.
      const isImpostorMember =
        !!this.impostor && loaders.length > 0 && IMPOSTOR_HOLD_CHUNK_SIZES.includes(this.chunkSize)
      const entity = this.entity.world.createEntity({
        parent: this.entity,
        name: item.name,
        components,
        transform: new TransformComponent({
          keepWorld: true,
          world: mat4$premultiply(mat4CreateFromArray(item.transform), parentWorld),
          lifeCycle: range || isImpostorMember ? LifeCycleFlags.Propagate : LifeCycleFlags.Full,
        }),
      })
      if (isImpostorMember && debug.entries[0]) {
        debug.entries[0].color = Color.Magenta
      }
      if (inactive) {
        // shown only when the Inactive layer is enabled on the camera
        entity.layer = MaterialLayerMasks.Inactive
      }

      if (isImpostorMember) {
        this.impostor.addMember({ entity, loaders })
      } else if (range) {
        this.rangeSystem.add(entity, mat4GetTranslation(entity.getTransform().world, vec3.$0), range)
        this.rangeEntities.push(entity)
      }

      const spawner = entity.component(SliceSpawnerComponent, GetComponent.Optional)
      if (spawner) {
        this.slices.push(spawner)
      }
    }
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    for (const entity of this.rangeEntities) {
      this.rangeSystem.remove(entity)
    }
    this.rangeEntities.length = 0
    this.impostor?.removeMembers(this.entity)
  }
}

import { BoundsComponent, EcsGame, LifeCycleFlags, TransformComponent } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld, GetComponent, type GameComponent } from '@gglib/ecs'
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
  spherePointIntersects,
  vec3,
  vec3Copy,
  vec3DistanceSquared,
  type IVec3,
} from '@gglib/math'
import {
  assetReferenceKey,
  isTimeOfDayComponent,
  isViewerColliderComponent,
  isViewerLightComponent,
  isViewerMeshComponent,
  isViewerPointSpawnerComponent,
  isViewerPrefabSpawnerComponent,
  isViewerVolumeComponent,
} from '../../api'
import { CHUNK_MESH_RANGE, IMPOSTOR_HOLD_CHUNK_SIZES } from '../../constants'
import { ContentService } from '../../content'
import { MaterialLayerMasks } from '../../material'
import { CollisionComponent } from '../collision/CollisionComponent'
import { CollisionSystem } from '../collision/CollisionSystem'
import { DebugLayer, DebugShapeComponent } from '../debug/DebugShapeComponent'
import { TimeOfDayComponent } from '../level/TimeOfDayComponent'
import { LightComponent } from '../light/LightComponent'
import { RegionComponent } from '../region/RegionComponent'
import type { RegionImpostorComponent } from '../region/RegionImpostorComponent'
import { MeshLoaderComponent } from './MeshLoaderComponent'
import { RangeActivationSystem } from './RangeActivationSystem'
import { SliceSpawnerComponent } from './SliceSpawnerComponent'

/**
 * Camera movement that triggers a new update pass
 */
const MOVE_THRESHOLD_SQ = 1 * 1

export class SliceSystem extends GameSystem {
  private game: EcsGame
  private world: GameWorld
  private collision: CollisionSystem
  private content: ContentService
  private rangeSystem: RangeActivationSystem
  private activeRegions: GameQuery

  /**
   * Collision chunks are spawned only while collision is shown
   */
  private collisionEnabled = false

  private camPosition = vec3()
  private lastPosition = vec3(Infinity, Infinity, Infinity)
  /**
   * Set when the last pass left work behind, e.g. loaded or spawned slices
   */
  private hasPendingWork = true
  private topLevelCount = 0

  public initialize(world: GameWorld): void {
    this.world = world
    this.game = world.getSystem(EcsGame)
    this.content = world.getSystem(ContentService)
    this.rangeSystem = world.getSystem(RangeActivationSystem)
    this.activeRegions = world.query({ scope: 'active', required: [RegionComponent] })
  }

  public destroy(): void {
    //
  }

  public update() {
    const view = this.game.scene.getView(0)
    mat4GetTranslation(view.camera.world, this.camPosition)

    let topLevelCount = 0
    for (const entity of this.activeRegions) {
      topLevelCount += entity.component(RegionComponent).slices.length
    }

    // systems are added after this one, resolved lazily
    this.collision ??= this.world.getSystem(CollisionSystem, { optional: true })
    const collisionEnabled = !!this.collision?.isEnabled
    const collisionChanged = collisionEnabled !== this.collisionEnabled
    this.collisionEnabled = collisionEnabled

    const moved = vec3DistanceSquared(this.camPosition, this.lastPosition) >= MOVE_THRESHOLD_SQ
    if (!moved && !this.hasPendingWork && !collisionChanged && topLevelCount === this.topLevelCount) {
      return
    }
    if (moved) {
      this.lastPosition.x = this.camPosition.x
      this.lastPosition.y = this.camPosition.y
      this.lastPosition.z = this.camPosition.z
    }
    this.topLevelCount = topLevelCount
    this.hasPendingWork = false

    for (const entity of this.activeRegions) {
      const region = entity.$(RegionComponent)
      this.updateSlices(region.slices, this.camPosition)
    }
  }

  private updateSlices(slices: SliceSpawnerComponent[], camera: IVec3) {
    for (const component of slices) {
      if (!component.entity.isActive) {
        if (component.entity.canInitialize) {
          component.entity.initialize()
        }
        if (component.entity.canActivate) {
          component.entity.activate()
        }
      }
      this.updateSlice(component, camera)
      if (component.slices.length) {
        this.updateSlices(component.slices, camera)
      }
    }
  }

  private updateSlice(component: SliceSpawnerComponent, camera: IVec3) {
    if (component.isSpawned) {
      return
    }
    if (component.impostor) {
      // chunks owned by impostor are spawned by impostor
      return
    }
    if (component.isCollision && !this.collisionEnabled) {
      return
    }
    if (!component.isLoaded) {
      resolveSpawnData(component)
      this.hasPendingWork = true
      return
    }

    const world = component.entity.getTransform().world
    const position = mat4GetTranslation(world, vec3.$0)
    const intersects = spherePointIntersects(position, component.spawnRadius, camera)
    if (intersects) {
      executeSpawner(component)
      // spawned slices may contain nested spawners
      this.hasPendingWork = true
    }
  }
}

export function resolveSpawnData(spawner: SliceSpawnerComponent) {
  if (spawner.isLoaded) {
    return
  }
  spawner.isLoaded = true
  const content = spawner.entity.world.getSystem(ContentService)
  const assetKey = assetReferenceKey(spawner.slice)
  spawner.data = content.slices.get(assetKey)
  if (!spawner.data) {
    console.warn(`Slice data not found for ${assetKey}`)
    return
  }

  spawner.spawnRadius = spawner.data.spawnRadius
  if (spawner.isChunk) {
    spawner.spawnRadius = Math.max(spawner.spawnRadius, 128 * 3)
  }

  const bounds = BoundingSphere.create(0, 0, 0, spawner.spawnRadius)
  spawner.bounds.setLocalBounds(bounds, null)
}

export function executeSpawner(spawner: SliceSpawnerComponent) {
  if (spawner.isSpawned || !spawner.isLoaded) {
    return
  }

  spawner.isSpawned = true

  if (!spawner.data?.entities?.length) {
    return
  }

  const region = spawner.entity.$(RegionComponent.Tag).region
  const rangeSystem = spawner.entity.world.getSystem(RangeActivationSystem)

  for (const item of spawner.data.entities) {
    // entities of an inactive spawner (nested slice) are inactive as well
    const inactive = !!item.inactive || spawner.entity.layer === MaterialLayerMasks.Inactive
    let range = 0

    const debug = new DebugShapeComponent()
    const components: GameComponent[] = [debug]
    const meshLoaders: MeshLoaderComponent[] = []
    let hasCollision = false

    for (const comp of item.components) {
      if (isViewerMeshComponent(comp)) {
        const loader = new MeshLoaderComponent(comp)
        meshLoaders.push(loader)
        components.push(loader)
        let meshRange = comp.maxViewDistance * comp.viewDistanceMultiplier
        if (spawner.isChunk) {
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
            // cellAt: spawner.cellAt,
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
            // cellAt: spawner.cellAt,
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
      if (isViewerColliderComponent(comp) || isViewerVolumeComponent(comp)) {
        if (hasCollision) {
          console.warn(`multiple CollisionComponents detected`, components, comp)
        } else {
          hasCollision = true
          components.push(new CollisionComponent(comp))
        }
        continue
      }
      console.log('Component not implemented', comp)
    }

    let parentWorld = spawner.entity.getTransform().world
    if (spawner.data.transform) {
      // The slice root entity has its own transform (data.transform), e.g. a rotation.
      // Entity transforms are stored relative to the slice origin, not relative to the root.
      // The spawner places the root, not the origin. So we first undo the root transform
      // (multiply by its inverse), then apply the spawner transform:
      //   entityWorld = spawnerWorld * inverse(rootTransform) * entityTransform
      // mat4Multiply returns a new matrix, the spawner world is not modified.
      parentWorld = mat4Multiply(parentWorld, mat4Invert(mat4CreateFromArray(spawner.data.transform)))
    }
    const world = mat4$premultiply(mat4CreateFromArray(item.transform), parentWorld)

    let impostorCell: RegionImpostorComponent | null = null
    if (!meshLoaders.length) {
      //
    } else if (meshLoaders.some((it) => it.data.impostor)) {
      impostorCell = region.poiImpostorAt(world[12], world[13])
    } else if (spawner.impostor && IMPOSTOR_HOLD_CHUNK_SIZES.includes(spawner.chunkSize)) {
      impostorCell = spawner.impostor
    }

    const entity = spawner.entity.world.createEntity({
      parent: spawner.entity,
      name: item.name,
      components,
      transform: new TransformComponent({
        keepWorld: true,
        world,
        lifeCycle: range || impostorCell ? LifeCycleFlags.PropagateOnly : LifeCycleFlags.InheritAndPropagate,
      }),
    })
    if (impostorCell && debug.entries[0]) {
      debug.entries[0].color = Color.Magenta
    }
    if (inactive) {
      // shown only when the Inactive layer is enabled on the camera
      entity.layer = MaterialLayerMasks.Inactive
    }

    if (impostorCell) {
      impostorCell.addMember({ entity, loaders: meshLoaders })
      spawner.memberCells.add(impostorCell)
    } else if (range) {
      rangeSystem.add(entity, range)
      spawner.rangeEntities.push(entity)
    }

    const child = entity.component(SliceSpawnerComponent, GetComponent.Optional)
    if (child) {
      spawner.slices.push(child)
    }
  }
}

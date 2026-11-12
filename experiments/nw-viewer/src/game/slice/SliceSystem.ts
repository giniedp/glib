import { BoundsComponent, EcsGame, LifeCycleFlags, TransformComponent } from '@gglib/components'
import { GameQuery, GameSystem, GameWorld, GetComponent, type GameComponent } from '@gglib/ecs'
import { Color } from '@gglib/graphics'
import {
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
  mat4CreateTranslation,
  mat4GetTranslation,
  mat4Identity,
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
  isViewerAudioAmbienceComponent,
  isViewerAudioAreaComponent,
  isViewerAudioTriggerComponent,
  isViewerColliderComponent,
  isViewerDecalComponent,
  isViewerFogVolumeComponent,
  isViewerLightComponent,
  isViewerMeshComponent,
  isViewerParticleComponent,
  isViewerPointSpawnerComponent,
  isViewerPrefabSpawnerComponent,
  isViewerRoadComponent,
  isViewerVolumeComponent,
  isViewerWaterVolumeComponent,
  type ViewerRoadComponent,
  type ViewerWaterVolumeComponent,
} from '../../api'
import { AudioEmitterComponent, AudioScriptComponent } from '../../audio/AudioEmitterComponent'
import { CHUNK_MESH_RANGE, IMPOSTOR_HOLD_CHUNK_SIZES, ROAD_VIEW_DISTANCE } from '../../constants'

/**
 * View distance of decals without one (LmbrCentral DecalConfiguration m_maxViewDist default is 8000, nwbt delivers
 * the automatic or override distance, so this is only a fallback)
 */
const DECAL_VIEW_DISTANCE = 100
import { ContentService } from '../../content'
import { MaterialLayerMasks } from '../../material'
import { CollisionComponent } from '../collision/CollisionComponent'
import { CollisionSystem } from '../collision/CollisionSystem'
import { DebugLayer, DebugShapeComponent, type DebugShapeOptions } from '../debug/DebugShapeComponent'
import { DecalComponent, decalMatrix } from '../decal/DecalComponent'
import { DECAL_BOX_FROM_UNIT_BOX } from '../decal/DecalSystem'
import { FogVolumeComponent, fogVolumeLocalScale } from '../fog/FogVolumeComponent'
import { TimeOfDayComponent } from '../level/TimeOfDayComponent'
import { LightComponent } from '../light/LightComponent'
import { ParticleComponent, particleRange } from '../particles/ParticleComponent'
import { createEnvProbeComponents } from '../probes/EnvProbeComponent'
import { RegionComponent } from '../region/RegionComponent'
import type { RegionImpostorComponent } from '../region/RegionImpostorComponent'
import { RoadComponent } from '../road/RoadComponent'
import { WaterVolumeComponent } from '../water/WaterVolumeComponent'
import { shapeOutline } from '../water/WaterVolumeMesh'
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
  /**
   * Spawners outside of regions, e.g. the slice preview of the browser, updated like the slices of a region
   */
  private previewSpawners: SliceSpawnerComponent[] = []

  /**
   * Spawns a slice outside of a region (no impostor cells), until its entity is destroyed
   */
  public addPreviewSpawner(spawner: SliceSpawnerComponent) {
    this.previewSpawners.push(spawner)
    this.hasPendingWork = true
  }

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

    for (let i = this.previewSpawners.length - 1; i >= 0; i--) {
      if (this.previewSpawners[i].entity.isDestroyed) {
        this.previewSpawners.splice(i, 1)
      }
    }
    let topLevelCount = this.previewSpawners.length
    for (const entity of this.activeRegions) {
      topLevelCount += entity.component(RegionComponent).slices.length
    }

    // systems are added after this one, resolved lazily
    this.collision ??= this.world.getSystem(CollisionSystem, { optional: true })
    const collisionEnabled = !!this.collision?.collidersNeeded
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
    if (this.previewSpawners.length) {
      this.updateSlices(this.previewSpawners, this.camPosition)
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
    const intersects = component.isChunk
      ? chunkInRange(position, component.chunkSize, component.spawnRadius, camera)
      : spherePointIntersects(position, component.spawnRadius, camera)
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

  // none for a preview spawner (SliceSystem.addPreviewSpawner): no impostor cells
  const region = spawner.entity.$(RegionComponent.Tag, GetComponent.Optional)?.region ?? null
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
        const shape: DebugShapeOptions = {
          type: 'box',
          color: vec3((comp.priority ?? 1) / 10),
          alpha: 0.125,
          layer: DebugLayer.TimeOfDay,
          solid: true,
        }

        if (comp.shape === 'box') {
          shape.type = 'box'
          shape.instances = [mat4CreateScaleXYZ(comp.width, comp.depth, comp.height)]
          components.push(new TimeOfDayComponent(comp))
        } else if (comp.shape === 'sphere') {
          shape.type = 'sphere'
          shape.instances = [mat4CreateScaleUniform(comp.radius)]
          components.push(new TimeOfDayComponent(comp))
        } else if (comp.shape === 'cylinder') {
          shape.type = 'cylinder'
          shape.instances = [mat4CreateScaleXYZ(comp.radius, comp.radius, comp.height)]
          components.push(new TimeOfDayComponent(comp))
        } else {
          console.warn('Unknown TimeOfDay shape', comp.shape)
        }
        debug.add(shape)
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
            components.push(...createEnvProbeComponents(light, debug))
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
      if (isViewerRoadComponent(comp)) {
        components.push(new RoadComponent(comp))
        debug.add({
          type: 'sphere',
          color: vec3(Color.Orange),
          layer: DebugLayer.Roads,
          instances: comp.spline.vertices.map((v) => mat4CreateTranslation(vec3(v))),
        })
        range = Math.max(range, roadRange(comp))
        continue
      }
      if (isViewerDecalComponent(comp)) {
        components.push(new DecalComponent(comp))
        debug.add({
          type: 'box',
          color: vec3(Color.Orange),
          layer: DebugLayer.Decals,
          // in entity space, the decal matrix of an identity entity transform
          instances: [mat4Multiply(decalMatrix(mat4Identity(), comp), DECAL_BOX_FROM_UNIT_BOX)],
        })
        range = Math.max(range, (comp.maxViewDistance || DECAL_VIEW_DISTANCE) * (comp.viewDistanceMultiplier || 1))
        continue
      }
      if (isViewerFogVolumeComponent(comp)) {
        components.push(new FogVolumeComponent(comp))
        const shape = comp.volumeType === 1 ? 'box' : 'sphere'
        debug.add({
          type: shape,
          color: vec3(Color.Cyan),
          layer: DebugLayer.FogVolumes,
          instances: [fogVolumeLocalScale(comp, shape)],
        })
        continue
      }
      if (isViewerAudioTriggerComponent(comp)) {
        // like lights, inactive entities would play without being visible
        if (!inactive) {
          components.push(new AudioEmitterComponent(comp))
        }
        continue
      }
      if (isViewerAudioAmbienceComponent(comp) || isViewerAudioAreaComponent(comp)) {
        if (!inactive) {
          components.push(new AudioScriptComponent(comp))
        }
        continue
      }
      if (isViewerParticleComponent(comp)) {
        // like lights, inactive entities are alternative states that scripts or events switch on
        if (!inactive) {
          components.push(new ParticleComponent(comp))
          range = Math.max(range, particleRange(spawner.entity.world, comp))
        }
        continue
      }
      if (isViewerWaterVolumeComponent(comp)) {
        components.push(new WaterVolumeComponent(comp))
        range = Math.max(range, waterVolumeRange(comp))
        continue
      }
      // the type only: with DevTools attached, the console keeps logged objects (slice data) alive
      console.log('Component not implemented', (comp as { type?: string }).type)
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
    } else if (region && meshLoaders.some((it) => region.isImpostorMesh(it.data))) {
      impostorCell = region.poiImpostorAt(world[12], world[13])
    } else if (spawner.impostor && IMPOSTOR_HOLD_CHUNK_SIZES.includes(spawner.chunkSize)) {
      impostorCell = spawner.impostor
    }

    // Lumberyard entities may hold several components of one type (e.g. two decals), a gglib entity holds one per
    // type. The repeats go onto satellite child entities at the same transform, which activate with the entity.
    const unique: GameComponent[] = []
    const satellites: GameComponent[] = []
    const types = new Set<unknown>()
    for (const component of components) {
      if (types.has(component.constructor)) {
        satellites.push(component)
      } else {
        types.add(component.constructor)
        unique.push(component)
      }
    }

    const entity = spawner.entity.world.createEntity({
      parent: spawner.entity,
      name: item.name,
      components: unique,
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
    for (const component of satellites) {
      const satellite = spawner.entity.world.createEntity({
        name: `${item.name} (${component.constructor.name})`,
        components: [component],
        transform: new TransformComponent({ local: mat4Identity() }),
      })
      // the layer before the parent: attaching to an active entity activates the satellite
      satellite.layer = entity.layer
      satellite.getTransform<TransformComponent>().setParent(entity.getTransform())
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

/**
 * Whether the camera is within range of a chunk. The chunk position is its cell center, the range is measured
 * from the cell square (xy), so large chunks (e.g. 1024 m) spawn when the camera gets close to any part of them.
 */
function chunkInRange(center: IVec3, size: number, range: number, camera: IVec3) {
  const half = size * 0.5
  const dx = Math.max(Math.abs(camera.x - center.x) - half, 0)
  const dy = Math.max(Math.abs(camera.y - center.y) - half, 0)
  return dx * dx + dy * dy <= range * range
}

/**
 * View range of a road measured from the entity origin: the view distance plus the extent of the spline,
 * long roads have their origin far away from most of their geometry
 */
function roadRange(road: ViewerRoadComponent) {
  let radius = 0
  for (const v of road.spline.vertices) {
    radius = Math.max(radius, Math.hypot(v[0], v[1]))
  }
  return ROAD_VIEW_DISTANCE * (road.viewDistanceMultiplier || 1) + radius + road.width
}

/**
 * View range of a water volume measured from the entity origin: the view distance plus the extent of the surface
 */
function waterVolumeRange(water: ViewerWaterVolumeComponent) {
  let radius = 0
  for (const p of shapeOutline(water.shape) ?? []) {
    radius = Math.max(radius, Math.hypot(p.x, p.y))
  }
  return ROAD_VIEW_DISTANCE * (water.viewDistanceMultiplier || 1) + radius
}

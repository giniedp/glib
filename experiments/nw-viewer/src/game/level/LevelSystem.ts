import {
  BoundsComponent,
  CameraComponent,
  EcsGame,
  MeshComponent,
  ModelComponent,
  OccTree,
  SpatialComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'
import { AssetType } from '@gglib/content'
import { GameEntity, GameSystem, GameWorld, GetComponent, type CreateEntityOptions } from '@gglib/ecs'
import {
  boxGeometry,
  Color,
  cylinderGeometry,
  Geometry,
  Material,
  Mesh,
  planeGeometry,
  sphereGeometry,
  type Device,
  type MaterialOptions,
  type MeshOptions,
} from '@gglib/graphics'
import {
  BoundingSphere,
  DEGREE_TO_RAD,
  mat4$preTranslateX,
  mat4$preTranslateZ,
  mat4CreateFromArray,
  mat4CreateRotationX,
  mat4Identity,
  vec3,
  vec3Copy,
} from '@gglib/math'
import { Model } from '@gglib/model'
import { Renderer } from '@gglib/render'
import { lfmt } from '@gglib/utils'
import {
  fetchTypedRequest,
  getLevelInfoUrl,
  isTimeOfDayComponent,
  isViewerMeshComponent,
  type LevelInfo,
  type ViewerMeshComponent,
  type ViewerSlice,
} from '../../api'
import { ContentService } from '../../content'
import { InputSlots, SkyMaterial } from '../../material'
import { ShapeMaterial } from '../../material/ShapeMaterial'
import { MeshLoaderComponent } from '../slice/MeshLoaderComponent'
import { TerrainSystem } from '../terrain/TerrainSystem'
import { levelEntityOptions } from './LevelComponent'
import { SkyLightSystem } from './SkyLightSystem'
import { TimeOfDayComponent } from './TimeOfDayComponent'

export class LevelSystem extends GameSystem {
  private content: ContentService
  private sky: SkyLightSystem
  private terrain: TerrainSystem

  public game: EcsGame
  public entity: GameEntity

  public camera: CameraComponent
  /**
   * Info of the loaded level, null while none is loaded
   */
  public levelInfo: LevelInfo | null = null

  private renderer: Renderer
  private skyEntity: GameEntity
  private cloudsEntity: GameEntity
  /**
   * Key of the skybox slice the clouds dome is spawned from, null for the default dome
   */
  private cloudsKey: string | null = null
  private gizmoEntity: GameEntity
  private oceanLevel = -1000

  private logTag = lfmt.badge('#FF9DA7', 'LevelSystem')
  private get timeOfDay() {
    return this.sky.timeOfDay
  }

  public initialize(game: GameWorld): void {
    this.game = game.getSystem(EcsGame)
    this.content = game.getSystem(ContentService)
    this.renderer = game.getSystem(Renderer)

    this.sky = game.getSystem(SkyLightSystem)
    this.terrain = game.getSystem(TerrainSystem)
  }

  public destroy(): void {
    this.unload()
  }

  public override update(time: number, dt: number): void {
    const skyMesh = this.skyEntity?.component<MeshComponent>(MeshComponent, GetComponent.Optional)?.mesh
    if (skyMesh) {
      const material = skyMesh.materials[0] as SkyMaterial
      material.NightMoonColor = this.timeOfDay.nightSkyMoonColor
      material.NightMoonInnerCorona = this.timeOfDay.nightSkyMoonInnerCorona
      material.NightMoonOuterCorona = this.timeOfDay.nightSkyMoonOuterCorona
      material.NightSkyColBase = this.timeOfDay.nightSkyHorizonColor
      material.NightSkyColDelta = this.timeOfDay.nightSkyColorDelta
      material.NightSkyZenithColShift = this.timeOfDay.nightSkyZenithColorShift

      material.setMoonParams(
        this.timeOfDay.moonRotationLatitude,
        this.timeOfDay.moonRotationLongitude,
        this.timeOfDay.moonSize,
        this.timeOfDay.moonDirection,
      )
      if (this.timeOfDay.moonTexture) {
        material.MoonMap = this.timeOfDay.moonTexture
      }

      material.SkyMieMap = this.sky.mieScatteringMap
      material.SkyRayleighMap = this.sky.rayleighScatteringMap
      material.setSkylightParams(
        this.timeOfDay.skyKM,
        this.timeOfDay.skyKR,
        this.timeOfDay.skyG,
        this.timeOfDay.skyWaveR,
        this.timeOfDay.skyWaveG,
        this.timeOfDay.skyWaveB,
        this.timeOfDay.skySunIntensity,
      )
      material.SunDirection = this.timeOfDay.skySunDirection
    }

    this.renderer.inputs.set(InputSlots.Global.OceanLevel, this.oceanLevel)
    this.updateCloudsDome()
  }

  /**
   * Swaps the cloud dome to the skybox slice of the active TimeOfDay POI
   */
  private updateCloudsDome() {
    if (!this.entity) {
      return
    }
    const sky = this.sky.activeSky
    const key = sky ? `${sky.guid}_${sky.subId}` : null
    if (key === this.cloudsKey) {
      return
    }
    this.cloudsKey = key
    if (this.cloudsEntity) {
      this.cloudsEntity.destroy()
      this.cloudsEntity.setParent(null)
    }
    const mesh = key ? findSkyMesh(this.content.slices.get(key)) : null
    if (key && !mesh) {
      console.warn(...this.logTag, `Skybox mesh not found in ${sky.hint || key}, using default clouds`)
    }
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity, mesh))
  }

  public async loadLevel(name: string) {
    this.loadCancel()

    if (!name) {
      return
    }

    const loadSignal = this.beginLoad()

    console.log(...lfmt.merge(this.logTag, lfmt.green(`Loading level ${name}`)))

    const levelInfo = await fetchTypedRequest(this.content.nwbtUrl, getLevelInfoUrl(name))
    loadSignal.throwIfAborted()

    console.log(...this.logTag, 'Level data loaded', levelInfo)
    this.levelInfo = levelInfo

    this.entity = this.game.createEntity(levelEntityOptions(this.game.scene.entity, levelInfo))
    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.content.updateSlices(levelInfo.slices ?? {})
    for (const options of createSkyboxSystem(this.entity, levelInfo.skyboxSystem)) {
      this.game.createEntity(options)
    }

    this.oceanLevel = levelInfo.oceanLevel
    this.timeOfDay.setLevelInfo(levelInfo, {
      content: this.content,
      signal: loadSignal,
    })

    this.terrain.setLevelInfo(levelInfo, {
      content: this.content,
      signal: loadSignal,
    })
  }

  public async loadModel(model: string, material?: string, transform?: number[]) {
    this.loadCancel()

    if (!model) {
      return
    }

    const loadSignal = this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    wasd.orbitMode = true
    wasd.radiusMax = 1000
    this.entity = this.game.createEntity({
      name: `Model: ${model}`,
      components: [
        new SpatialComponent({
          index: OccTree.create({
            min: vec3(-2048, -2048, -2048),
            max: vec3(2048, 2048, 2048),
            leafLevel: 5,
            looseFactor: 2,
          }),
        }),
        new MeshLoaderComponent({
          type: 'Mesh',
          mesh: model,
          material,
          alwaysRender: true,
        }),
      ],
      parent: this.game.scene.entity,
      transform: new TransformComponent({
        keepWorld: true,
        world: transform ? mat4CreateFromArray(transform) : mat4Identity(),
      }),
    })
    this.entity.events.on(MeshLoaderComponent.onLoad, (e) => {
      setTimeout(() => {
        // must be next frame, when bounds are updated
        this.handleModelLoadeed(e, wasd)
      })
    })

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  public async loadMaterial(assetUrl: string) {
    this.loadCancel()

    if (!assetUrl) {
      return
    }

    const loadSignal = this.beginLoad()

    const camera = this.game.scene.getView(0).camera as CameraComponent
    const wasd = camera.entity.component(WASDComponent)
    wasd.orbitMode = true
    wasd.radiusMax = 1000
    wasd.targetRadius = 5
    wasd.targetVertical = 45 * DEGREE_TO_RAD
    wasd.orbitCenter.z = 4

    const content = this.content
    const asset = await content.loadAsset(assetUrl)
    loadSignal.throwIfAborted()

    const materials: Material[] = []
    for (let i = 0; i < asset.count(AssetType.Material); i++) {
      const options = await asset.load<MaterialOptions>(AssetType.Material, i, {
        content: content.loader,
        baseUrl: content.nwbtFileUrl,
      })
      loadSignal.throwIfAborted()

      const material = content.loader.createMaterial(options)
      materials.push(material)
    }

    const shapes = ['cylinder', 'box', 'sphere'] as const
    const meshOptions: MeshOptions = {
      materials,
      partImports: [],
    }
    for (let z = 0; z < shapes.length; z++) {
      for (let x = 0; x < materials.length; x++) {
        const transform = mat4CreateRotationX(Math.PI / 2)
        mat4$preTranslateX(transform, (x - Math.max(0, materials.length - 1) / 2) * 2)
        mat4$preTranslateZ(transform, (z + 0.5) * 2)

        let geometry: Geometry
        switch (shapes[z]) {
          case 'box': {
            geometry = boxGeometry(this.renderer.device, {
              vertexLayout: [['position', 'normal', 'tangent', 'bitangent', 'texture', 'color']],
              vertexTransform: transform,
              size: 1.8,
            })
            break
          }
          case 'sphere': {
            geometry = sphereGeometry(this.renderer.device, {
              vertexLayout: [['position', 'normal', 'tangent', 'bitangent', 'texture', 'color']],
              vertexTransform: transform,
              radius: 0.9,
            })
            break
          }
          case 'cylinder': {
            geometry = cylinderGeometry(this.renderer.device, {
              vertexLayout: [['position', 'normal', 'tangent', 'bitangent', 'texture', 'color']],
              vertexTransform: transform,
              closeTop: true,
              closeBottom: true,
            })
            break
          }
        }
        meshOptions.partImports.push({
          geometry,
          materialIndex: x,
        })
      }
    }

    const mesh = new Mesh(this.renderer.device, meshOptions)
    this.entity = this.game.createEntity({
      components: [
        new SpatialComponent({
          index: OccTree.create({
            min: vec3(-2048),
            max: vec3(2048),
            leafLevel: 5,
            looseFactor: 2,
          }),
        }),
        new BoundsComponent(),
        new ModelComponent({
          model: new Model(this.renderer.device, {
            meshes: [mesh],
          }),
        }),
      ],
      parent: this.game.scene.entity,
      transform: new TransformComponent({
        keepWorld: true,
        world: mat4Identity(),
      }),
    })

    this.skyEntity = this.game.createEntity(createSkySphere(this.entity, this.renderer.device))
    this.cloudsEntity = this.game.createEntity(createCloudsDome(this.entity))
    this.gizmoEntity = this.game.createEntity(createGizmoGrid(this.entity, this.renderer.device))
  }

  private loadCtrl: AbortController
  private beginLoad() {
    this.loadCancel()
    this.loadCtrl = new AbortController()
    return this.loadCtrl.signal
  }

  private loadCancel() {
    if (this.loadCtrl) {
      this.loadCtrl.abort()
      this.loadCtrl = null
    }
    this.unload()
  }

  private unload() {
    this.levelInfo = null
    this.skyEntity = null
    this.gizmoEntity = null
    this.cloudsEntity = null
    this.cloudsKey = null
    if (this.entity) {
      this.entity.destroy()
      this.entity.setParent(null)
      this.entity = null
    }
  }

  private handleModelLoadeed(entity: GameEntity, wasd: WASDComponent) {
    const sphere = BoundingSphere.create()
    for (const child of entity.getTransform().children) {
      const bounds = child.entity.component(BoundsComponent, GetComponent.Optional)
      if (bounds?.world?.sphere) {
        sphere.mergeSphere(bounds.world.sphere)
      }
    }
    if (!sphere.isEmpty) {
      vec3Copy(sphere.center, wasd.orbitCenter)
      wasd.targetRadius = sphere.radius * 2
    }
  }
}

function createGizmoGrid(parent: GameEntity, device: Device): CreateEntityOptions {
  const grid = planeGeometry(device, {
    lines: true,
    width: 128,
    depth: 128,
    widthSegments: 128,
    depthSegments: 128,
    vertexTransform: mat4CreateRotationX(-Math.PI / 2),
  })
  const material = new ShapeMaterial(device, { properties: {} })
  material.Color = Color.DimGray.toVec4()
  material.Transform = mat4Identity()

  return {
    parent,
    name: 'GizmoGrid',
    transform: new TransformComponent({
      keepWorld: true,
    }),
    components: [
      new MeshComponent({
        mesh: new Mesh(device, {
          materials: [material],
          partImports: [
            {
              geometry: grid,
              materialIndex: 0,
            },
          ],
        }),
      }),
    ],
  }
}

/**
 * Cloud layer of the sky.
 *
 * The game spawns slices/system/skyboxsystem (not referenced by the level data). Its TimeOfDayPOIComponent
 * (radius 12000 around 7000,7000, libs/timeofday/default.xml) references slices/sky/newworld01_skybox_a, a mesh component
 * with this dome and no material override (uses the cgf material objects/sky/testclouds_sky_a_mtl.mtl, DistanceClouds).
 * Other POIs (zones, events, dungeons) reference other skybox slices, the SkyLightSystem picks the active one.
 *
 * Without a mesh (model / material preview, missing slice data) the default dome is used.
 */
const CLOUDS_DOME_CGF = 'objects/sky/skydome_a.cgf'
function createCloudsDome(parent: GameEntity, mesh?: ViewerMeshComponent | null): CreateEntityOptions {
  mesh ||= {
    type: 'Mesh',
    mesh: CLOUDS_DOME_CGF,
    alwaysRender: true,
  }
  return {
    name: `Clouds`,
    parent: parent,
    components: [new MeshLoaderComponent(mesh)],
  }
}

/**
 * The mesh of a skybox slice (slices/sky/*), each slice holds a single dome mesh
 */
function findSkyMesh(slice: ViewerSlice | undefined): ViewerMeshComponent | null {
  for (const entity of slice?.entities ?? []) {
    const mesh = entity.components.find(isViewerMeshComponent)
    if (mesh) {
      return mesh
    }
  }
  return null
}

/**
 * TimeOfDay POIs of the skybox system slice, the default TimeOfDay and skybox of the open world
 */
function createSkyboxSystem(parent: GameEntity, slice: ViewerSlice | null | undefined): CreateEntityOptions[] {
  const result: CreateEntityOptions[] = []
  for (const item of slice?.entities ?? []) {
    const tod = item.components.find(isTimeOfDayComponent)
    if (!tod) {
      continue
    }
    result.push({
      name: item.name,
      parent,
      transform: new TransformComponent({
        keepWorld: true,
        world: mat4CreateFromArray(item.transform),
      }),
      components: [new TimeOfDayComponent(tod)],
    })
  }
  return result
}

function createSkySphere(parent: GameEntity, device: Device): CreateEntityOptions {
  const geometry = sphereGeometry(device, {
    radius: 128,
    vertexTransform: mat4CreateRotationX(-Math.PI / 2),
  })
  const material = new SkyMaterial(device, { properties: {} })
  return {
    name: `Sky`,
    parent: parent,
    components: [
      new MeshComponent({
        mesh: new Mesh(device, {
          materials: [material],
          partImports: [
            {
              geometry: geometry,
              materialIndex: 0,
            },
          ],
        }),
      }),
    ],
  }
}

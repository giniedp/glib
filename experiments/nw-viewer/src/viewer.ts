import {
  BasicGame,
  CameraComponent,
  KeyboardInputSystem,
  MouseInputSystem,
  SceneRootComponent,
  SchedulerSystem,
  SpatialRootComponent,
  SpatialSystem,
  TransformComponent,
  WASDComponent,
  type SceneStats,
  type SchedulerStats,
} from '@gglib/components'
import { type GameEntity, type GameQuery } from '@gglib/ecs'
import { Color, type DeviceStats } from '@gglib/graphics'
import { DDS, GLTF, HDR, KTX } from '@gglib/loaders'
import { DEGREE_TO_RAD, Mat4, RAD_TO_DEGREE, SpaceBasis, Vec3, Vec4 } from '@gglib/math'
import { BloomPass, VignettePass, type GeometryPass, type RendererStats } from '@gglib/render'
import { brand, lfmt, type EventType } from '@gglib/utils'

import { redrawUi } from 'tweak-ui'
import { getLevelListUrl } from './api'
import { REGION_SIZE, REGION_VISIBILITY } from './constants'
import { ContentService } from './content'
import { CapitalSystem } from './game/capital/CapitalSystem'
import { DebugLayer, DebugShapeComponent } from './game/debug/DebugShapeComponent'
import { DebugShapeSystem } from './game/debug/DebugShapeSystem'
import { RaycastSystem, type RaySelection } from './game/debug/RaycastSystem'
import { LevelSystem } from './game/level/LevelSystem'
import { RegionSystem } from './game/region/RegionSystem'
import { SliceSystem } from './game/slice/SliceSystem'
import { TerrainSystem } from './game/terrain/TerrainSystem'
import { InputSlots, NwMaterialExtension } from './material'
import { attachOverlay } from './ui/overlay'

export interface NwViewerOptions {
  element: HTMLDivElement
  canvas: HTMLCanvasElement
}

export interface LevelLoadOption {
  value: string
  label: string
}

export class NwViewer extends BasicGame {
  public static readonly onRaySelection = brand<EventType<GameEntity>>(Symbol('raySelection'))
  public static readonly onLevelOptionsLoaded = brand<EventType<NwViewer>>(Symbol('levelOptions'))

  public camera: CameraComponent

  public deviceStats: DeviceStats
  public schedulerStats: SchedulerStats
  public sceneStats: SceneStats
  public renderStats: RendererStats
  public scheduler: SchedulerSystem
  public levelSelection: string
  public levelOptions: LevelLoadOption[] = []
  public logTag = lfmt.badge('#4E79A7', 'NwViewer')

  public onRaySelection = this.events.channel(NwViewer.onRaySelection)
  public onLevelOptionsLoaded = this.events.channel(NwViewer.onLevelOptionsLoaded)

  public selection: GameEntity
  public spatialQuery: GameQuery

  public debug: number = 0
  public constructor(options: NwViewerOptions) {
    super({
      canvas: options.canvas,
      webgpu: {
        deviceOptions: () => {
          return {
            requiredLimits: {
              maxTextureArrayLayers: 512,
            },
          }
        },
      },
      platform: 'webgpu',
    })

    this.renderer.autoSrgb = true
    this.renderer.clearColor = Color.Black.srgbToLinear()
    const geometryPass = this.renderer.pipeline.passes[0] as GeometryPass
    geometryPass.enableLinearDepthMrt = true
    this.renderer.pipeline.addPass(
      new BloomPass(this.device, {
        enabled: true,
        glowCut: 1,
        multiplier: 0.65,
        iterations: 4,
        resolutionScale: 0.25,
      }),
      new VignettePass(this.device, {}),
    )

    this.scheduler = this.world.getSystem(SchedulerSystem)

    GLTF.Loader.registerExtension(NwMaterialExtension)
    GLTF.Loader.registerExtension(GLTF.KhrMaterialsSpecular)

    this.content.registerLoader(GLTF.Loader)
    this.content.registerLoader(KTX.Loader)
    this.content.registerLoader(DDS.Loader)
    this.content.registerLoader(HDR.Loader)

    const camera = this.createEntity({
      name: 'Camera',
      parent: this.scene,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [
        new CameraComponent({
          type: 'perspective',
          near: 0.1,
          far: REGION_SIZE + REGION_VISIBILITY,
          perspectiveFov: 90 * DEGREE_TO_RAD,
          reversedZ: true,
          aspect: this.device.output.aspectRatio,
        }),
        new WASDComponent(),
      ],
    })
    this.camera = camera.component(CameraComponent)

    this.view.camera = camera.component(CameraComponent)
    this.renderer.onContextReady.add((ctx) => {
      ctx.renderInputs.set(InputSlots.Global.Debug, this.debug)
    })

    this.spatialQuery = this.world.query({ scope: 'active', required: [SpatialRootComponent] })
    this.selection = this.world.createEntity({
      name: 'Selection',
      parent: this.scene,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [
        new DebugShapeComponent({
          type: 'box',
          color: Color.DarkMagenta.toVec3(),
          layer: DebugLayer.Selection,
        }),
      ],
    })

    const raycast = this.world.getSystem(RaycastSystem)
    raycast.camera = this.camera
    raycast.onSelect.add((selection) => {
      this.updateSelection(selection)
    })

    this.world.getSystem(LevelSystem).camera = this.camera

    attachOverlay(options.element, this)
  }

  protected override createSystems(): void {
    this.world.addSystem(SpaceBasis.Z_UP_POS_Y)
    this.world.addSystem(new ContentService())
    this.world.addSystem(new KeyboardInputSystem())
    this.world.addSystem(new MouseInputSystem({}))
    this.world.addSystem(new TerrainSystem())
    this.world.addSystem(new RegionSystem())
    this.world.addSystem(new CapitalSystem())
    this.world.addSystem(new SliceSystem())
    this.world.addSystem(new LevelSystem())
    this.world.addSystem(new DebugShapeSystem())
    this.world.addSystem(new RaycastSystem())
    this.world.addSystem(new SpatialSystem())
    this.world.addSystem(new SchedulerSystem({}))
  }

  override async initialize() {
    super.initialize()
    this.scene.activate()
    console.log(...this.logTag, 'initialized', this)
    this.loadLevelLoadOptions()
    this.attachRoutes()
  }

  override update(time: number, dt: number): void {
    super.update(time, dt)
    this.device.resize()
    this.camera.aspect = this.device.output.aspectRatio
    this.scheduler.updatePriorities(this.view.camera, time)
  }

  private updateSelection(selection: RaySelection) {
    const shape = this.selection.component(DebugShapeComponent).entries[0]
    if (!selection) {
      shape.transforms.length = 0
      return
    }

    const boxScale = Vec3.subtract(selection.box.max, selection.box.min)
    const boxCenter = Vec3.add(selection.box.min, selection.box.max).multiplyScalar(0.5)
    const boxTransform = Mat4.createFromRTS(Vec4.create(0, 0, 0, 1), boxCenter, boxScale)
    const nodeTransform = selection.node.world

    shape.type = 'box'
    shape.transforms[0] ||= new Mat4()
    shape.transforms[0].initScaleUniform(1.001).premultiply(boxTransform).premultiply(nodeTransform)
    shape.transforms.length = 1

    console.log(...this.logTag, 'Selected entity', selection)
    this.onRaySelection.emit(selection.entity)
  }

  public frameTime = 0
  override render(time: number, dt: number): void {
    super.render(time, dt)
    this.frameTime = dt
    this.deviceStats = this.device.stats(this.deviceStats)
    this.schedulerStats = this.scheduler.instance.getStats(this.schedulerStats)
    this.sceneStats = this.scene.component(SceneRootComponent).stats(this.sceneStats)
    this.renderStats = this.renderer.stats(this.renderStats)
  }

  public dispose() {
    this.stop()
  }

  public loadLevel(name: string) {
    this.levelSelection = name
    this.world.getSystem(LevelSystem).loadLevel(name)
    redrawUi()
  }

  public teleport(x: number, y: number, z: number, rot: number = 0) {
    this.camera.entity
      .component(TransformComponent)
      .setPosition(x, y, z)
      .setRotationAxisAngle(0, 0, 1, rot)
      .updateIfNeeded()
    this.camera.entity.component(WASDComponent).setRotation(rot || 0, 0)
    this.camera.updateBehavior()
  }

  private async loadLevelLoadOptions() {
    const levels = await this.world.getSystem(ContentService).fetchTypedRequest(getLevelListUrl())
    const options: LevelLoadOption[] = []
    for (const level of levels.coatlicues) {
      if (!level.maps.length) {
        options.push({
          value: `${level.name}?position=1024,1024,256,0`,
          label: level.name,
        })
      }
    }

    for (const level of levels.coatlicues) {
      if (!level.maps.length) {
        continue
      }
      const mapCount = level.maps.length
      for (const map of level.maps) {
        const position = map.teamTeleportData.split('+')[0] || '1024,1024,256,0'
        options.push({
          value: `${level.name}?position=${position}`,
          label: mapCount > 1 ? `${level.name}: ${map.gameModeMapId}` : map.gameModeMapId,
        })
      }
    }

    this.levelOptions = options
    console.log(...this.logTag, 'Loaded level options', this.levelOptions)
    this.onLevelOptionsLoaded.emit(this)
  }

  private attachRoutes() {
    this.loadLevelFromUrl(window.location.href)

    const camera = this.camera

    setInterval(() => {
      const t = camera.world.getTranslation(Vec3.$0)
      const r = camera.entity.component(WASDComponent).getRotationHorizontal()

      const position = [t.x, t.y, t.z, r * RAD_TO_DEGREE].map((it) => it.toFixed(1)).join(',')
      const params = new URLSearchParams(window.location.search)
      params.delete('position')
      const existing = params.toString()
      const query = (existing ? existing + '&' : '') + 'position=' + position
      window.history.replaceState({}, '', window.location.pathname + '?' + query)
    }, 1000)
  }

  public onLevelSelected(value: string) {
    window.location.href = value
  }

  public loadLevelFromUrl(value: string) {
    const url = new URL(value, window.location.href)
    const level = url.pathname.split('/').filter((it) => !!it)[0]
    const positionParam = new URLSearchParams(url.search).get('position') || '1024,1024,256,0'
    const position = positionParam.split(',').map((it) => parseFloat(it))
    if (level) {
      this.loadLevel(level)
    }
    if (position.length >= 3) {
      this.teleport(position[0] || 0, position[1] || 0, position[2] || 0, (position[3] || 0) * DEGREE_TO_RAD)
    }
  }

  public loadModel(model: string, material?: string, transform?: number[]) {
    this.world.getSystem(LevelSystem).loadModel(model, material, transform)
    this.teleport(0, 0, 0)
  }

  public loadImage(image: string) {
    //
  }

  public loadSlice(slice: string) {
    //
  }
}

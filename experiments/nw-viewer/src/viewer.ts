import {
  CameraComponent,
  EcsGame,
  KeyboardInputSystem,
  MouseInputSystem,
  SchedulerSystem,
  SpatialSystem,
  TransformComponent,
  WASDComponent,
  type SceneStats,
  type SchedulerStats,
} from '@gglib/components'
import { type GameEntity } from '@gglib/ecs'
import { MouseListener } from '@gglib/game'
import { Color, type DeviceStats } from '@gglib/graphics'
import { DDS, HDR } from '@gglib/loaders'
import {
  DEGREE_TO_RAD,
  mat4,
  mat4$initScaleUniform,
  mat4$premultiply,
  mat4CreateFromRTS,
  mat4GetTranslation,
  RAD_TO_DEGREE,
  SpaceBasis,
  vec3,
  vec3Add,
  vec3MultiplyScalar,
  vec3Subtract,
  vec4,
} from '@gglib/math'
import { Renderer, type RendererStats } from '@gglib/render'
import { brand, lfmt, type EventType } from '@gglib/utils'
import { redrawUi } from 'tweak-ui'
import { getLevelListUrl } from './api'
import { REGION_SIZE } from './constants'
import { ContentService } from './content'
import { registerCgf } from './formats/cgf'
import { registerMtl } from './formats/mtl'
import { registerRnr } from './formats/rnr'
import { AudioSystem } from './audio/AudioSystem'
import { CapitalSystem } from './game/capital/CapitalSystem'
import { CollisionSystem } from './game/collision/CollisionSystem'
import { DebugLayer, DebugShapeComponent } from './game/debug/DebugShapeComponent'
import { DebugShapeSystem } from './game/debug/DebugShapeSystem'
import { RaycastSystem, type RaySelection } from './game/debug/RaycastSystem'
import { DistributionSystem } from './game/distribution/DistributionSystem'
import { InstancedRenderSystem } from './game/instancing/InstancedRenderSystem'
import { LevelSystem } from './game/level/LevelSystem'
import { SkyLightSystem } from './game/level/SkyLightSystem'
import { LightSystem } from './game/light/LightSystem'
import { RegionSystem } from './game/region/RegionSystem'
import { RangeActivationSystem } from './game/slice/RangeActivationSystem'
import { SliceSystem } from './game/slice/SliceSystem'
import { RoadSystem } from './game/road/RoadSystem'
import { TerrainSystem } from './game/terrain/TerrainSystem'
import { VegetationSystem } from './game/vegetation/VegetationSystem'
import { ViewerConfig } from './config'
import { createRenderPipeline } from './graphics'
import { RenderSizeSystem } from './graphics/RenderSizeSystem'
import { InputSlots, MaterialLayerMasks } from './material'
import { attachOverlay } from './ui/overlay'

export interface NwViewerOptions {
  element: HTMLDivElement
  canvas: HTMLCanvasElement
}

export interface LevelLoadOption {
  value: string
  label: string
  isOpenWorld: boolean
  category: string
}

export class NwViewer extends EcsGame {
  public static readonly onRaySelection = brand<EventType<GameEntity>>(Symbol('raySelection'))
  public static readonly onLevelOptionsLoaded = brand<EventType<NwViewer>>(Symbol('levelOptions'))

  public camera: CameraComponent
  public mode?: 'level' | 'model' | 'image' | 'material' | 'slice' = null

  public deviceStats: DeviceStats
  public schedulerStats: SchedulerStats
  public sceneStats: SceneStats
  public renderStats: RendererStats
  public scheduler: SchedulerSystem
  public levelSelection: string
  public levelOptions: Record<string, LevelLoadOption[]> = {}

  public logTag = lfmt.badge('#4E79A7', 'NwViewer')

  public onRaySelection = this.events.channel(NwViewer.onRaySelection)
  public onLevelOptionsLoaded = this.events.channel(NwViewer.onLevelOptionsLoaded)

  public selection: GameEntity

  public debug: number = 0
  public constructor(options: NwViewerOptions) {
    super({
      canvas: options.canvas,
      webgpu: {
        deviceOptions: () => {
          return {
            requiredLimits: {
              // terrain virtual texture page cache, see VT_PAGE_CAPACITY
              maxTextureArrayLayers: 1024,
            },
          }
        },
      },
      platform: 'webgpu',
      // the render size is set by the RenderSizeSystem, from the config
      autosize: false,
    })
    attachOverlay(options.element, this)
  }

  /**
   * The runtime settings, see {@link ViewerConfig}
   */
  public get config(): ViewerConfig {
    return this.world.getSystem(ViewerConfig)
  }

  protected override onCreate(): void {
    // first, so systems and components can read the settings when they initialize
    const config = new ViewerConfig()
    config.load()
    this.world.addSystem(config)
    this.world.addSystem(new RenderSizeSystem())
    this.world.addSystem(SpaceBasis.Z_UP_POS_Y)
    this.world.addSystem(new ContentService())
    this.world.addSystem(new KeyboardInputSystem())
    this.world.addSystem(
      new MouseInputSystem({
        provider: new MouseListener({
          captureTarget: this.device.canvas as HTMLCanvasElement,
          eventTarget: this.device.canvas as HTMLCanvasElement,
        }),
      }),
    )
    this.world.addSystem(new TerrainSystem())
    this.world.addSystem(new RegionSystem())
    this.world.addSystem(new DistributionSystem())
    this.world.addSystem(new VegetationSystem())
    this.world.addSystem(new InstancedRenderSystem())
    this.world.addSystem(new CapitalSystem())
    this.world.addSystem(new SliceSystem())
    this.world.addSystem(new RoadSystem())
    this.world.addSystem(new CollisionSystem())
    this.world.addSystem(new RangeActivationSystem())
    this.world.addSystem(new SkyLightSystem())
    this.world.addSystem(new LightSystem())
    this.world.addSystem(new LevelSystem())
    this.world.addSystem(new AudioSystem())
    this.world.addSystem(new DebugShapeSystem())
    this.world.addSystem(new RaycastSystem())
    this.world.addSystem(new SpatialSystem())
    this.world.addSystem(new SchedulerSystem({}))
    this.world.addSystem(
      new Renderer(this.device, {
        linearToSrgb: false,
        pipeline: createRenderPipeline(this.device),
      }),
    )
  }

  protected override onInitialize(): void {
    super.onInitialize()

    this.content.registerLoader(DDS.Loader)
    this.content.registerLoader(HDR.Loader)
    registerRnr(this.content)
    registerMtl(this.content)
    registerCgf(this.content)

    this.scheduler = this.world.getSystem(SchedulerSystem)

    this.camera = this.createEntity({
      name: 'Camera',
      parent: this.scene.entity,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [
        new CameraComponent({
          type: 'perspective',
          near: 0.1,
          far: 2 * REGION_SIZE,
          perspectiveFov: 90 * DEGREE_TO_RAD,
          reversedZ: true,
          aspect: this.device.output.aspectRatio,
        }),
        // used to debug distances
        // new DebugShapeComponent({
        //   type: 'cylinder',
        //   color: Color.Magenta,
        //   solid: true,
        //   alpha: 0.1,
        //   instances: [
        //     mat4CreateFromRTS(quatCreateIdentity(), vec4(), vec3(128 * 1.5)),
        //   ],
        // }),
        new WASDComponent(),
      ],
    }).component(CameraComponent)
    // runtime inactive entities are hidden by default, the layer can be toggled in the camera UI
    this.camera.visibilityMask &= ~MaterialLayerMasks.Inactive

    this.selection = this.world.createEntity({
      name: 'Selection',
      parent: this.scene.entity,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [
        new DebugShapeComponent({
          type: 'box',
          color: Color.DarkMagenta.toVec3(),
          layer: DebugLayer.Selection,
          instances: [],
        }),
      ],
    })

    this.scene.getView(0).camera = this.camera

    const raycast = this.world.getSystem(RaycastSystem)
    raycast.camera = this.camera
    raycast.onSelect.add((selection) => {
      this.updateSelection(selection)
    })

    this.world.getSystem(LevelSystem).camera = this.camera
  }

  override onBeginRun() {
    this.world.initialize()
    this.world.getSystem(ContentService).whenLoaded.then(() => {
      this.scene.entity.activate()
      this.loadLevelLoadOptions()
      this.attachRoutes()
    })
  }

  override onBeginUpdate(time: number, dt: number): void {
    super.onBeginUpdate(time, dt)
    this.camera.aspect = this.device.output.aspectRatio
    this.scheduler.updatePriorities(this.camera, time)
    this.world.getSystem(Renderer).inputs.set(InputSlots.Global.Debug, this.debug)
  }

  public frameTime = 0
  override onEndDraw(time: number, dt: number): void {
    super.onEndDraw(time, dt)
    this.frameTime = dt
    this.deviceStats = this.device.stats(this.deviceStats)
    this.schedulerStats = this.scheduler.instance.getStats(this.schedulerStats)
    this.sceneStats = this.scene.stats(this.sceneStats)
    this.renderStats = this.world.getSystem(Renderer).stats(this.renderStats)
    if (this.screenshotRequests.length) {
      this.takeScreenshot()
    }
  }

  private screenshotRequests: Array<(image: Blob | null) => void> = []

  /**
   * Captures the next rendered frame as PNG, at the render resolution
   *
   * @remarks
   * A WebGPU canvas can only be read in the task that renders the frame, so the capture runs after the next draw.
   */
  public captureScreenshot(): Promise<Blob | null> {
    return new Promise((resolve) => this.screenshotRequests.push(resolve))
  }

  /**
   * Captures the next rendered frame and downloads it as PNG
   */
  public async downloadScreenshot() {
    const image = await this.captureScreenshot()
    if (!image) {
      return
    }
    const link = document.createElement('a')
    link.href = URL.createObjectURL(image)
    link.download = screenshotFileName(this.device.canvas.width, this.device.canvas.height)
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }

  private takeScreenshot() {
    const requests = this.screenshotRequests.splice(0)
    const source = this.device.canvas
    const canvas = new OffscreenCanvas(source.width, source.height)
    const context = canvas.getContext('2d')
    // opaque image, the output may contain transparent pixels
    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(source, 0, 0)
    canvas.convertToBlob({ type: 'image/png' }).then(
      (image) => requests.forEach((resolve) => resolve(image)),
      (err) => {
        console.warn('screenshot failed', err)
        requests.forEach((resolve) => resolve(null))
      },
    )
  }

  public dispose() {
    this.stop()
  }

  private updateSelection(selection: RaySelection) {
    const shape = this.selection.component(DebugShapeComponent).entries[0]
    if (!selection) {
      shape.transforms.length = 0
      return
    }

    const boxScale = vec3Subtract(selection.box.max, selection.box.min)
    const boxCenter = vec3MultiplyScalar(vec3Add(selection.box.min, selection.box.max), 0.5)
    const boxTransform = mat4CreateFromRTS(vec4(0, 0, 0, 1), boxCenter, boxScale)
    const nodeTransform = selection.node.world

    shape.type = 'box'
    shape.transforms[0] ||= mat4()
    mat4$initScaleUniform(shape.transforms[0], 1.001)
    mat4$premultiply(shape.transforms[0], boxTransform)
    mat4$premultiply(shape.transforms[0], nodeTransform)
    shape.transforms.length = 1

    console.log(...this.logTag, 'Selected entity', selection)
    this.onRaySelection.emit(selection.entity)
  }

  public async loadLevel(name: string) {
    this.mode = 'level'
    this.levelSelection = name
    await this.world.getSystem(ContentService).whenLoaded
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
    const params = new URLSearchParams()
    const options: Record<string, LevelLoadOption[]> = {}

    const openWorld = 'newworld_vitaeeterna'
    function categorize(nameOrId: string, subName?: string) {
      let result = nameOrId.match(/_(arena|battleroyale|ctf|dungeon|opr|raid|trial|quest)/)?.[1]
      result ||= nameOrId.match(/^(arena|battleroyale|dungeon|capturetheflag|outpostrush|raid|trial|quest)/i)?.[1]
      result ||= subName?.match(/(ctf)/i)?.[1]
      result ||= 'other'
      result = result.toLowerCase()
      if (result === 'capturetheflag') {
        result = 'ctf'
      }
      if (result === 'outpostrush') {
        result = 'opr'
      }
      return result
    }

    for (const level of levels.coatlicues) {
      if (!!level.maps.length) {
        continue
      }

      params.set('level', level.name)
      params.set('x', '1024')
      params.set('y', '1024')
      params.set('z', '256')
      params.set('w', '0')
      const category = categorize(level.name)
      options[category] ||= []
      options[category].push({
        value: params.toString(),
        label: level.name,
        isOpenWorld: level.level === openWorld,
        category,
      })
    }

    for (const level of levels.coatlicues) {
      if (!level.maps.length) {
        continue
      }
      for (const map of level.maps) {
        const position = (map.teamTeleportData.split('+')[0] || '1024,1024,256,0').split(',').map(Number)
        params.set('level', level.name)
        params.set('x', String(position[0] || 0))
        params.set('y', String(position[1] || 0))
        params.set('z', String(position[2] || 0))
        params.set('w', String(position[3] || 0))
        const category = categorize(map.gameModeMapId, level.name)
        options[category] ||= []
        options[category].push({
          value: params.toString(),
          label: map.gameModeMapId,
          isOpenWorld: level.level === openWorld,
          category: category,
        })
      }
    }

    this.levelOptions = options
    console.log(...this.logTag, 'Loaded level options', this.levelOptions)
    this.onLevelOptionsLoaded.emit(this)
  }

  private attachRoutes() {
    const camera = this.camera
    const params = new URL(window.location.href).searchParams
    this.teleport(
      Number(params.get('x') ?? 1024) || 0,
      Number(params.get('y') ?? 1024) || 0,
      Number(params.get('z') ?? 256) || 0,
      (Number(params.get('w') ?? 0) || 0) * DEGREE_TO_RAD,
    )

    setInterval(() => {
      const t = mat4GetTranslation(camera.world, vec3.$0)
      const r = camera.entity.component(WASDComponent).getRotationHorizontal()
      const params = new URLSearchParams(window.location.search)
      params.set('x', t.x.toFixed(1))
      params.set('y', t.y.toFixed(1))
      params.set('z', t.z.toFixed(1))
      params.set('w', (r * RAD_TO_DEGREE).toFixed(1))
      const query = params.toString()
      window.history.replaceState({}, '', window.location.pathname + '?' + query)
    }, 1000)
  }

  public onLevelSelected(value: string) {
    const url = new URL(window.location.href)
    const params = new URLSearchParams(value)
    params.forEach((value, key) => {
      url.searchParams.set(key, value)
    })
    window.location.href = url.toString()
  }

  public loadModel(model: string, material?: string, transform?: number[]) {
    this.mode = 'model'
    this.world.getSystem(LevelSystem).loadModel(model, material, transform)
    this.teleport(0, 0, 0)
    redrawUi()
  }

  public loadMaterial(asset: string) {
    this.mode = 'material'
    this.world.getSystem(LevelSystem).loadMaterial(asset)
    this.teleport(0, 0, 0)
    redrawUi()
  }

  public loadImage(image: string) {
    this.mode = 'model'
    redrawUi()
  }

  public loadSlice(slice: string) {
    this.mode = 'model'
    redrawUi()
  }
}

/**
 * File name of a screenshot: level, position, size and time, e.g. `nw-viewer_newworld_vitaeeterna_5500_600_1920x1080_2026-10-11T12-00-00.png`
 */
function screenshotFileName(width: number, height: number) {
  const params = new URLSearchParams(location.search)
  const parts = ['nw-viewer']
  if (params.get('level')) {
    parts.push(params.get('level'))
  }
  if (params.get('x') && params.get('y')) {
    parts.push(String(Math.round(Number(params.get('x')))), String(Math.round(Number(params.get('y')))))
  }
  parts.push(`${width}x${height}`, new Date().toISOString().slice(0, 19).replace(/:/g, '-'))
  return parts.join('_') + '.png'
}

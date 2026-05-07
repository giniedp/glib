import {
  BasicGame,
  CameraComponent,
  KeyboardInputSystem,
  MouseInputSystem,
  SceneRootComponent,
  SchedulerSystem,
  SpatialSystem,
  TransformComponent,
  WASDComponent,
  type SceneStats,
  type SchedulerStats,
} from '@gglib/components'
import { Color, type DeviceStats } from '@gglib/graphics'
import { DDS, GLTF, HDR, KTX } from '@gglib/loaders'
import { DEGREE_TO_RAD } from '@gglib/math'
import { mountUi } from 'tweak-ui'
import { REGION_SIZE, REGION_VISIBILITY } from './constants'
import { LevelSystem } from './level/LevelSystem'
import { DebugOptions, NwBindingKeys, NwMaterialExtension } from './material'
import { ContentService } from './services/content-service'
import { TerrainSystem } from './terrain/TerrainSystem'
import { NwSceneBrowser } from './ui'

export interface NwViewerOptions {
  element: HTMLDivElement
  canvas: HTMLCanvasElement
}

export class NwViewer extends BasicGame {
  public paniniBlend = 0
  public paniniDistance = 1
  public paniniScale = 0.15

  public camera: CameraComponent

  private deviceStats: DeviceStats
  private schedulerStats: SchedulerStats
  private sceneStats: SceneStats
  private scheduler: SchedulerSystem

  public debug: number = DebugOptions._None
  public constructor(options: NwViewerOptions) {
    super({
      canvas: options.canvas,
      platform: 'webgpu',
    })

    this.world.addSystem(new ContentService())
    this.world.addSystem(new KeyboardInputSystem())
    this.world.addSystem(new MouseInputSystem({ eventTarget: options.canvas }))
    this.world.addSystem(new TerrainSystem())
    this.world.addSystem(new LevelSystem())
    this.world.addSystem(new SpatialSystem(this.world))
    this.world.addSystem(new SchedulerSystem())

    this.renderer.autoSrgb = true
    this.renderer.clearColor = Color.Black.srgbToLinear()
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
        // position: { x: -7483, y: 350, z: 9014 },
        // position: { x: -11933, y: 1024, z: 7472 },
        // position: { x: -9352, y: 250, z: 2772 },
        // position: { x: -7645, y: 300, z: 6633 },
        // position: { x: -12640, y: 500, z: 6088 },
        // position: { x: -7250, y: 250, z: 7250 }, // [3:3] brimstone south east
        // position: { x: -1024 - 2048 - 2048, y: 250, z: 1024 },
        // position: { x: -1024, y: 250, z: 1024 },
        position: { x: -1024, y: 250, z: 1024 },
        keepWorld: true,
      }),
      components: [
        new CameraComponent({
          type: 'perspective',
          near: 0.1,
          far: REGION_SIZE + REGION_VISIBILITY,
          perspectiveFov: 90 * DEGREE_TO_RAD,
          reversedZ: true,
        }),
        new WASDComponent(),
      ],
    })
    this.camera = camera.component(CameraComponent)

    this.view.camera = camera.component(CameraComponent)
    this.renderer.onContextReady.add((ctx) => {
      ctx.renderParams['view.paniniBlend'] = this.paniniBlend
      ctx.renderParams['view.paniniDistance'] = this.paniniDistance
      ctx.renderParams['view.paniniScale'] = this.paniniScale

      ctx.renderParams[NwBindingKeys.Settings.Debug] = this.debug
    })

    this.attachUi(options.element)
  }

  override initialize(): void {
    super.initialize()
    this.scene.activate()
    console.log('NwViewer initialized', this)
  }

  override update(time: number, dt: number): void {
    super.update(time, dt)
    this.scheduler.updatePriorities(this.view.camera, time)
  }

  private frameTime = 0
  override render(time: number, dt: number): void {
    super.render(time, dt)
    this.frameTime = dt
    this.deviceStats = this.device.stats(this.deviceStats)
    this.schedulerStats = this.scheduler.instance.getStats(this.schedulerStats)
    this.sceneStats = this.scene.component(SceneRootComponent).stats(this.sceneStats)
  }

  public loadLevel(name: string) {
    this.world.getSystem(LevelSystem).loadLevel(name, null)
  }

  public dispose() {
    this.stop()
  }

  private attachUi(element: HTMLDivElement) {
    const treeEl = document.createElement('div')
    treeEl.style.position = 'absolute'
    treeEl.style.top = '0'
    treeEl.style.left = '0'
    element.appendChild(treeEl)
    mountUi(treeEl, (ui) => {
      ui.add(NwSceneBrowser, {
        scene: this.scene,
      })
    })

    const toolsEl = document.createElement('div')
    toolsEl.style.position = 'absolute'
    toolsEl.style.top = '0'
    toolsEl.style.right = '0'
    element.appendChild(toolsEl)
    mountUi(toolsEl, (ui) => {
      ui.group('NW Viewer', () => {
        ui.button('Fullscreen', {
          onClick: () => {
            if (document.fullscreenElement) {
              document.exitFullscreen()
            } else {
              element.parentElement?.requestFullscreen()
            }
          },
        })
        ui.graph({
          collapsed: true,
          rows: [
            {
              name: 'Frame Time',
              min: 0,
              max: 100,
              smoothing: 0.9,
              sample: () => {
                return this.frameTime
              },
            },
            {
              name: 'FPS',
              min: 0,
              max: 240,
              smoothing: 0.9,
              sample: () => {
                return this.frameTime > 0 ? 1000 / this.frameTime : 0
              },
            },
            {
              name: 'Heap (MB)',
              min: 0,
              max: 500,
              sample: () => {
                if ((performance as any).memory) {
                  return (performance as any).memory.usedJSHeapSize / 1024 / 1024
                }
                return 0
              },
            },
            {
              name: 'Textures',
              min: 0,
              max: 1,
              sample: () => this.deviceStats?.textureCount || 0,
            },
            {
              name: 'Texture (MB)',
              min: 0,
              max: 1,
              sample: () => (this.deviceStats?.textureByteCount || 0) / 1024 / 1024,
            },
            {
              name: 'Shaders',
              min: 0,
              max: 1,
              sample: () => this.deviceStats?.shaderCount || 0,
            },
            {
              name: 'Tasks',
              min: 0,
              max: 1,
              sample: () => this.schedulerStats?.total || 0,
            },
            {
              name: 'Tasks (IF)',
              min: 0,
              max: 1,
              sample: () => this.schedulerStats?.inFlight || 0,
            },
            {
              name: 'Visible Entities',
              min: 0,
              max: 1,
              sample: () => this.sceneStats?.visible || 0,
            },
          ],
        })
      })
      ui.group('Camera', () => {
        ui.angle(this.camera, 'perspectiveFov', {
          label: 'FOV',
          min: 1,
          max: 179,
          step: 1,
        })
        ui.number(this.camera, 'near', {
          label: 'Near',
          slider: true,
          min: 0.01,
          max: 10,
          step: 0.01,
        })
        ui.number(this.camera, 'far', {
          label: 'Far',
          slider: true,
          min: 100,
          max: 10000,
          step: 100,
        })

        ui.number(this, 'paniniBlend', {
          label: 'Blend',
          min: 0,
          max: 1,
          step: 0.01,
          slider: true,
        })
        ui.number(this, 'paniniDistance', {
          label: 'Distance',
          min: 0,
          max: 1,
          step: 0.01,
          slider: true,
        })
        ui.number(this, 'paniniScale', {
          label: 'Scale',
          min: 0,
          max: 1,
          step: 0.01,
          slider: true,
        })
      })
      ui.group('Debug', () => {
        ui.select(this, 'debug', {
          label: 'Output',
          options: DebugOptions,
        })
      })
    })
  }
}

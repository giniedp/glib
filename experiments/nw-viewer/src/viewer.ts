import {
  CameraComponent,
  EcsGame,
  KeyboardInputSystem,
  MouseInputSystem,
  SchedulerSystem,
  SpatialSystem,
  TimeSystem,
  TransformComponent,
  WASDComponent,
  type SceneStats,
  type SchedulerStats,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { type GameEntity } from '@gglib/ecs'
import { GameLoop, MouseListener } from '@gglib/game'
import { Color, type DeviceStats } from '@gglib/graphics'
import { DDS, HDR } from '@gglib/loaders'
import {
  DEGREE_TO_RAD,
  mat4,
  mat4$initScaleUniform,
  mat4$premultiply,
  mat4CreateFromArray,
  mat4CreateFromRTS,
  mat4GetTranslation,
  RAD_TO_DEGREE,
  SpaceBasis,
  vec3,
  vec3Add,
  vec3ApplyMat4Rotation,
  vec3Dot,
  vec3MultiplyScalar,
  vec3Normalize,
  vec3Subtract,
  vec4,
  type Mat4,
} from '@gglib/math'
import { FxaaPass, RenderChannel, Renderer, RenderPipeline, type RendererStats, type RenderView } from '@gglib/render'
import { brand, lfmt, type EventType } from '@gglib/utils'
import { isViewerCameraComponent, type LevelInfo, type ViewerSlice } from './api'
import { AudioSystem } from './audio/AudioSystem'
import { ViewerConfig } from './config'
import { REGION_SIZE } from './constants'
import { ContentService } from './content'
import { ProbeCubeLoader } from './content/ProbeCubeLoader'
import { registerCgf } from './formats/cgf'
import { MtlContainer, registerMtl } from './formats/mtl'
import { CollisionSystem } from './game/collision/CollisionSystem'
import { CullingSystem } from './game/culling/CullingSystem'
import { DebugLayer, DebugShapeComponent } from './game/debug/DebugShapeComponent'
import { DebugShapeSystem } from './game/debug/DebugShapeSystem'
import { RaycastSystem, type RaySelection } from './game/debug/RaycastSystem'
import { DistributionSystem } from './game/distribution/DistributionSystem'
import { InstancedRenderSystem } from './game/instancing/InstancedRenderSystem'
import { LevelSystem } from './game/level/LevelSystem'
import { SkyLightSystem } from './game/level/SkyLightSystem'
import { LightSystem } from './game/light/LightSystem'
import { EnvProbeDebugSystem } from './game/probes/EnvProbeDebugSystem'
import { EnvProbeSystem } from './game/probes/EnvProbeSystem'
import { ParticleSystem } from './game/particles'
import { PlayerMovementComponent } from './game/player/PlayerMovementComponent'
import { RegionSystem } from './game/region/RegionSystem'
import { RoadSystem } from './game/road/RoadSystem'
import { DecalSystem } from './game/decal/DecalSystem'
import { FogVolumeSystem } from './game/fog/FogVolumeSystem'
import { RangeActivationSystem } from './game/slice/RangeActivationSystem'
import { SliceSystem } from './game/slice/SliceSystem'
import { TerrainSystem } from './game/terrain/TerrainSystem'
import { VegetationSystem } from './game/vegetation/VegetationSystem'
import { createRenderPipeline } from './graphics'
import { LuminancePass } from './graphics/passes/exposure/LuminancePass'
import { SmaaPass } from './graphics/passes/smaa/SmaaPass'
import { FroxelFogPass } from './graphics/passes/fog/FroxelFogPass'
import { Cmaa2Pass } from './graphics/passes/cmaa2/Cmaa2Pass'
import { UpscalePass } from './graphics/passes/upscale/UpscalePass'
import { TexturePreview, type TexturePreviewOptions } from './graphics/passes/texture/TexturePreview'
import { TexturePreviewPass } from './graphics/passes/texture/TexturePreviewPass'
import { RenderSizeSystem } from './graphics/RenderSizeSystem'
import { InputSlots, MaterialLayerMasks } from './material'

export interface NwViewerOptions {
  /**
   * The canvas to render into. It must be in the document before {@link NwViewer.run}: its parent is
   * observed for the render size.
   */
  canvas: HTMLCanvasElement
}

export class NwViewer extends EcsGame {
  public static readonly onRaySelection = brand<EventType<GameEntity>>(Symbol('raySelection'))
  public static readonly onModeChanged = brand<EventType<NwViewer>>(Symbol('mode'))

  public camera: CameraComponent
  /**
   * What the engine shows. `texture` is a texture preview of the browser, see {@link NwViewer.showTexture}
   */
  public mode?: 'level' | 'model' | 'material' | 'slice' | 'particles' | 'texture' = null

  public deviceStats: DeviceStats
  public schedulerStats: SchedulerStats
  public sceneStats: SceneStats
  public renderStats: RendererStats
  public scheduler: SchedulerSystem
  /**
   * Scene luminance of the eye adaptation, for debugging and scripts (`await nwViewer.luminance.read()`)
   */
  public luminance: LuminancePass | null = null
  public levelSelection: string

  public logTag = lfmt.badge('#4E79A7', 'NwViewer')

  public onRaySelection = this.events.channel(NwViewer.onRaySelection)
  /**
   * Emitted when a level, model or preview scene was opened, see {@link NwViewer.mode}
   */
  public onModeChanged = this.events.channel(NwViewer.onModeChanged)

  public selection: GameEntity

  public debug: number = 0
  public constructor(options: NwViewerOptions) {
    super({
      canvas: options.canvas,
      webgpu: {
        deviceOptions: (adapter: GPUAdapter) => {
          return {
            requiredLimits: {
              // terrain virtual texture page cache, see VT_PAGE_CAPACITY
              maxTextureArrayLayers: 1024,
              // Illum has 16 textures (default limit) plus the two cube arrays of the environment probes and the
              // froxel fog volume
              maxSampledTexturesPerShaderStage: Math.min(20, adapter.limits.maxSampledTexturesPerShaderStage),
            },
          }
        },
      },
      platform: 'webgpu',
      // the render size is set by the RenderSizeSystem, from the config
      autosize: false,
    })
  }

  /**
   * The runtime settings, see {@link ViewerConfig}
   */
  public get config(): ViewerConfig {
    return this.world.getSystem(ViewerConfig)
  }

  /**
   * The clocks. The game clock drives everything that animates: shaders (ElapsedTime), material updates, particles,
   * fog volume noise and the animated time of day. Scripts pin it for comparable shots:
   * `nwViewer.clock.setFixed(10)`, `nwViewer.clock.pause()`, `nwViewer.clock.resume()`, or the url `?clock=10`.
   * Camera movement, eye adaptation, POI blends, audio and loading budgets stay on the wall clock.
   */
  public get clock(): TimeSystem {
    return this.world.getSystem(TimeSystem)
  }

  protected override onCreate(): void {
    // first, so systems and components can read the settings when they initialize
    const config = new ViewerConfig()
    config.load()
    this.world.addSystem(config)
    // the viewer's clock: its game clock drives rendering, particles, fog volumes and the animated time of day, see
    // `clock`. Registered here, the overlay (attached below) reads it.
    const time = new TimeSystem()
    this.world.addSystem(time)
    this.renderClock = time.game
    this.world.addSystem(new RenderSizeSystem())
    this.world.addSystem(SpaceBasis.Z_UP_POS_Y)
    // instances are cached per url. Of the containers (file data) only the small material libraries stay cached,
    // models create several sub materials from them. Texture and geometry data is dropped after the GPU upload.
    this.world.addSystem(
      new ContentLoader(this.device, {
        cacheContainers: (container) => container instanceof MtlContainer,
      }),
    )
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
    this.world.addSystem(new SliceSystem())
    this.world.addSystem(new RoadSystem())
    this.world.addSystem(new DecalSystem())
    this.world.addSystem(new FogVolumeSystem())
    this.world.addSystem(new CollisionSystem())
    this.world.addSystem(new CullingSystem())
    this.world.addSystem(new RangeActivationSystem())
    this.world.addSystem(new SkyLightSystem())
    this.world.addSystem(new LightSystem())
    this.world.addSystem(new ProbeCubeLoader())
    this.world.addSystem(new EnvProbeSystem())
    this.world.addSystem(new EnvProbeDebugSystem())
    this.world.addSystem(new LevelSystem())
    this.world.addSystem(new AudioSystem())
    this.world.addSystem(new ParticleSystem())
    this.world.addSystem(new DebugShapeSystem())
    this.world.addSystem(new RaycastSystem())
    this.world.addSystem(new SpatialSystem())
    this.world.addSystem(new SchedulerSystem({}))
    const pipeline = createRenderPipeline(this.device)
    const smaa = pipeline.passes.find((it): it is SmaaPass => it instanceof SmaaPass)
    const fxaa = pipeline.passes.find((it): it is FxaaPass => it instanceof FxaaPass)
    const cmaa2 = pipeline.passes.find((it): it is Cmaa2Pass => it instanceof Cmaa2Pass)
    const applyAntialiasing = (value: string) => {
      if (smaa) {
        smaa.enabled = value === 'smaa'
      }
      if (fxaa) {
        fxaa.enabled = value === 'fxaa'
      }
      if (cmaa2) {
        cmaa2.enabled = value === 'cmaa2'
      }
    }
    applyAntialiasing(config.value.antialiasing)
    config.onChange('antialiasing', applyAntialiasing)
    const upscale = pipeline.passes.find((it): it is UpscalePass => it instanceof UpscalePass)
    if (upscale) {
      upscale.mode = config.value.upscaler
      upscale.sharpness = config.value.upscaleSharpness
      config.onChange('upscaler', (value) => (upscale.mode = value))
      config.onChange('upscaleSharpness', (value) => (upscale.sharpness = value))
    }
    const froxelFog = pipeline.passes.find((it): it is FroxelFogPass => it instanceof FroxelFogPass)
    if (froxelFog) {
      froxelFog.enabled = config.value.froxelFog
      froxelFog.tileSize = config.value.froxelTileSize
      froxelFog.slices = config.value.froxelSlices
      config.onChange('froxelFog', (value) => (froxelFog.enabled = value))
      config.onChange('froxelTileSize', (value) => (froxelFog.tileSize = value))
      config.onChange('froxelSlices', (value) => (froxelFog.slices = value))
    }
    this.luminance = pipeline.passes.find((it): it is LuminancePass => it instanceof LuminancePass) ?? null
    this.world.addSystem(
      new Renderer(this.device, {
        linearToSrgb: false,
        pipeline,
      }),
    )
  }

  protected override onInitialize(): void {
    super.onInitialize()

    this.content.registerLoader(DDS.Loader)
    this.content.registerLoader(HDR.Loader)
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
        // after WASD, takes its displacement in grounded mode
        new PlayerMovementComponent(),
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
    // ?clock=<seconds> fixes the game clock from the start, for comparable shots of time dependent effects
    const clock = new URLSearchParams(location.search).get('clock')
    if (clock != null && Number.isFinite(Number(clock))) {
      this.clock.setFixed(Number(clock))
    }
    this.world.getSystem(ContentService).whenLoaded.then(() => {
      this.scene.entity.activate()
      this.teleportFromUrl()
    })
  }

  override onBeginUpdate(time: number, dt: number): void {
    super.onBeginUpdate(time, dt)
    // the main view, letterboxed for a fixed resolution + fit
    this.camera.aspect = this.world.getSystem(RenderSizeSystem).aspectRatio
    this.scheduler.updatePriorities(this.camera, time)
    this.world.getSystem(Renderer).inputs.set(InputSlots.Global.Debug, this.debug)
  }

  /**
   * The texture view: one pass, no scene. Created with the first texture preview.
   */
  private textureView: RenderView | null = null
  private texturePass: TexturePreviewPass | null = null

  /**
   * The texture preview shown instead of the scene, see {@link NwViewer.showTexture}
   */
  public get texturePreview(): TexturePreview | null {
    return this.texturePass?.preview ?? null
  }

  /**
   * Uploads a texture for {@link NwViewer.showTexture}. The caller owns it and disposes it.
   */
  public createTexturePreview(options: TexturePreviewOptions): TexturePreview {
    return new TexturePreview(this.device, options)
  }

  /**
   * Shows a texture preview instead of the scene, or the scene again with null.
   *
   * @remarks
   * The engine shows one content at a time: showing a texture unloads the level (or model). The viewer
   * opens it again from its url when it is shown again (see ViewerTool).
   */
  public showTexture(preview: TexturePreview | null) {
    if (!preview) {
      if (this.texturePass) {
        this.texturePass.preview = null
      }
      if (this.mode === 'texture') {
        this.mode = null
        this.onModeChanged.emit(this)
      }
      return
    }
    this.previewing = true
    this.previewKey = null
    if (this.mode !== 'texture') {
      this.world.getSystem(LevelSystem).clear()
      this.levelSelection = null
      this.mode = 'texture'
      this.onModeChanged.emit(this)
    }
    if (!this.texturePass) {
      const renderer = this.world.getSystem(Renderer)
      this.texturePass = new TexturePreviewPass(this.device)
      this.textureView = renderer.createView({
        name: 'Texture Preview',
        present: RenderChannel.Color,
        pipeline: new RenderPipeline({ name: 'Texture Preview', passes: [this.texturePass] }),
        // no scene: the camera only satisfies the renderer
        camera: this.camera,
      })
    }
    this.texturePass.preview = preview
  }

  /**
   * The engine shows content of the browser (a texture or a model preview), not what the viewer opened. The viewer
   * opens its level again from the url, see {@link NwViewer.endPreview}.
   */
  public previewing = false

  /**
   * What the scene preview of the browser shows: `model:<path>`, `material:<path>`, `particles:<library>|<effect>`
   * or `slice:<path>`, null for none (or a texture preview)
   */
  public previewKey: string | null = null

  /**
   * Shows content of the browser in the scene: the level (or other content) is unloaded first. Showing the same
   * content again keeps it and the camera as they are.
   */
  private showScenePreview(key: string, mode: NwViewer['mode'], load: () => void) {
    this.showTexture(null)
    if (this.previewing && this.previewKey === key) {
      return
    }
    this.previewing = true
    this.previewKey = key
    this.levelSelection = null
    load()
    this.mode = mode
    this.onModeChanged.emit(this)
  }

  /**
   * Shows a model (`.cgf`, `.skin`) of the browser, the camera orbits it
   */
  public showModel(path: string) {
    this.showScenePreview(`model:${path}`, 'model', () => this.loadModel(path))
  }

  /**
   * Shows the sub materials of a `.mtl` of the browser on a cylinder, a box and a sphere each
   */
  public showMaterial(path: string) {
    this.showScenePreview(`material:${path}`, 'material', () => this.loadMaterial(path))
  }

  /**
   * The sub materials shown by {@link NwViewer.showMaterial}, in the order of their shader balls. Empty while loading.
   */
  public previewMaterialNames(): string[] {
    return this.previewKey?.startsWith('material:') ? this.world.getSystem(LevelSystem).materialNames : []
  }

  /**
   * Points the orbit camera at the shader ball of a sub material, null frames all of them
   */
  public framePreviewMaterial(index: number | null) {
    this.world.getSystem(LevelSystem).frameMaterial(index)
  }

  /**
   * Shows one particle effect of a library of the browser
   */
  public showParticleEffect(library: string, effect: string) {
    this.showScenePreview(`particles:${library}|${effect}`, 'particles', () =>
      this.world.getSystem(LevelSystem).loadParticleEffect(library, effect),
    )
  }

  /**
   * Shows a slice of the browser at the origin: `slices` holds the slice (`root`) and every slice it spawns
   */
  public showSlice(path: string, root: string, slices: Record<string, ViewerSlice>) {
    this.showScenePreview(`slice:${path}`, 'slice', () =>
      this.world.getSystem(LevelSystem).loadSlicePreview(root, slices, path.split('/').pop() ?? path),
    )
  }

  /**
   * The particle effect shown by {@link NwViewer.showParticleEffect}: emitters and live particles, null if none
   */
  public particlePreviewStats(): { state: string; emitters: number; particles: number } | null {
    const particles = this.world.getSystem(LevelSystem).particlePreview()
    return particles ? { state: particles.state, emitters: particles.emitterCount, particles: particles.particleCount } : null
  }

  /**
   * Ends the preview of the browser: the engine shows the scene again, empty until the viewer opens its content
   */
  public endPreview() {
    this.showTexture(null)
    this.previewing = false
    this.previewKey = null
    this.world.getSystem(LevelSystem).clear()
    this.camera.entity.component(WASDComponent).orbitMode = false
    this.mode = null
  }

  /**
   * The levels of detail of the shown model: the highest one that may exist (0 without levels) and the one rendered
   * (of the first instance)
   */
  public previewModelLod(): { maxLevel: number; rendered: number; forced: number | null } {
    const models = this.world.getSystem(LevelSystem).modelComponents()
    const first = models.find((it) => it.model?.lod) ?? models[0]
    return {
      maxLevel: first?.model?.lod?.maxLevel ?? 0,
      rendered: first?.lodRendered ?? 0,
      forced: first?.model?.lod?.forcedLevel ?? null,
    }
  }

  /**
   * Shows a level of detail of the shown model regardless of the distance, null selects by distance again
   */
  public forcePreviewModelLod(level: number | null) {
    for (const it of this.world.getSystem(LevelSystem).modelComponents()) {
      if (it.model?.lod) {
        it.model.lod.forcedLevel = level
      }
    }
  }

  /**
   * Points the orbit camera at the shown model (or the models of a shown slice) again
   *
   * @returns whether there was a model to frame
   */
  public framePreviewModel(): boolean {
    return this.world.getSystem(LevelSystem).frameModel()
  }

  /**
   * The scene, or the texture view while a texture preview is shown
   */
  protected override onDraw(time: number, dt: number): void {
    if (!this.texturePass?.preview) {
      super.onDraw(time, dt)
      return
    }
    this.world.render(time, dt)
    const renderer = this.world.getSystem(Renderer)
    renderer.update(this.renderClock?.total ?? time, this.renderClock?.delta ?? dt)
    renderer.renderView(this.textureView)
  }

  override onEndDraw(time: number, dt: number): void {
    if (this.texturePass?.preview) {
      this.world.getSystem(Renderer).present([this.textureView])
    } else {
      super.onEndDraw(time, dt)
    }
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
   * Captures the next rendered frame as PNG: the canvas, so the upscaled image at the output resolution (or the
   * render resolution for a fixed resolution + `none`)
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

  /**
   * Stops rendering, updates and sound, e.g. while no tool shows the canvas. {@link NwViewer.resume}
   * continues, the clocks skip the time in between.
   */
  public suspend() {
    this.stop()
    this.world.getSystem(AudioSystem, { optional: true })?.suspend()
  }

  /**
   * Continues after {@link NwViewer.suspend}. Only call it once the engine runs ({@link NwViewer.run}
   * resolved), before that the boot starts the loop.
   */
  public resume() {
    this.world.getSystem(GameLoop).run()
    this.world.getSystem(AudioSystem, { optional: true })?.resume()
  }

  /**
   * Moves the canvas into a container, the render size follows that container from then on
   */
  public placeCanvas(container: HTMLElement) {
    const canvas = this.device.canvas as HTMLCanvasElement
    if (canvas.parentElement !== container) {
      container.prepend(canvas)
    }
    this.world.getSystem(RenderSizeSystem, { optional: true })?.observeContainer()
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

    shape.transforms[0] ||= mat4()
    mat4$initScaleUniform(shape.transforms[0], 1.001)
    mat4$premultiply(shape.transforms[0], boxTransform)
    mat4$premultiply(shape.transforms[0], nodeTransform)
    shape.transforms.length = 1

    console.log(...this.logTag, 'Selected entity', selection)
    this.onRaySelection.emit(selection.entity)
  }

  /**
   * Opens a level: the coatlicue `name`, with the mission of the level folder `options.mission` when it differs from
   * the coatlicue (main menus). With `levelCamera`, the camera starts at the level's own camera placement once the
   * level info is loaded (see {@link findLevelCamera}), e.g. when the url names no position.
   */
  public async loadLevel(name: string, options?: { mission?: string | null; levelCamera?: boolean }) {
    this.mode = 'level'
    this.levelSelection = name
    await this.world.getSystem(ContentService).whenLoaded
    const level = this.world.getSystem(LevelSystem)
    const loading = level.loadLevel(name, options?.mission)
    this.onModeChanged.emit(this)
    if (!options?.levelCamera) {
      return
    }
    try {
      await loading
    } catch {
      // cancelled by another load, or failed: nothing to place
      return
    }
    const camera = level.levelInfo?.name === name ? findLevelCamera(level.levelInfo) : null
    if (camera) {
      this.placeCamera(camera)
    }
  }

  /**
   * Moves the camera to a camera placement of a level, looking where the placement looks
   */
  public placeCamera(world: Mat4) {
    const space = this.world.getSystem(SpaceBasis)
    const position = mat4GetTranslation(world, vec3())
    const look = vec3Normalize(vec3ApplyMat4Rotation(space.forward, world, vec3()))
    // the inverse of WASDComponent.setRotation: rotation about up by the heading, then about right by the pitch
    const pitch = Math.asin(Math.max(-1, Math.min(1, vec3Dot(look, space.up))))
    const heading = Math.atan2(-vec3Dot(look, space.right), vec3Dot(look, space.forward))
    this.teleport(position.x, position.y, position.z, heading)
    this.camera.entity.component(WASDComponent).setRotation(heading, pitch)
    this.cameraPlaced = true
  }

  public teleport(x: number, y: number, z: number, rot: number = 0) {
    this.camera.entity
      .component(TransformComponent)
      .setPosition(x, y, z)
      .setRotationAxisAngle(0, 0, 1, rot)
      .updateIfNeeded()
    this.camera.entity.component(WASDComponent).setRotation(rot || 0, 0)
    this.camera.entity.component(PlayerMovementComponent).teleport()
    this.camera.updateBehavior()
  }

  /**
   * Moves the camera to the position of the url parameters `x`, `y`, `z` and the heading `w` (degrees)
   */
  public teleportFromUrl() {
    const params = new URL(window.location.href).searchParams
    this.teleport(
      Number(params.get('x') ?? 1024) || 0,
      Number(params.get('y') ?? 1024) || 0,
      Number(params.get('z') ?? 256) || 0,
      (Number(params.get('w') ?? 0) || 0) * DEGREE_TO_RAD,
    )
    this.cameraPlaced = true
  }

  /**
   * Whether the camera was placed from the url parameters, before that its position is the default
   */
  private cameraPlaced = false

  /**
   * Writes the camera position (`x`, `y`, `z`) and heading (`w`, degrees) into url parameters,
   * the inverse of the parameters read at start. Returns false, and writes nothing, until the camera
   * was placed from the url.
   */
  public writeCameraParams(params: URLSearchParams): boolean {
    if (!this.cameraPlaced) {
      return false
    }
    const camera = this.camera
    const t = mat4GetTranslation(camera.world, vec3.$0)
    const r = camera.entity.component(WASDComponent).getRotationHorizontal()
    params.set('x', t.x.toFixed(1))
    params.set('y', t.y.toFixed(1))
    params.set('z', t.z.toFixed(1))
    params.set('w', (r * RAD_TO_DEGREE).toFixed(1))
    return true
  }

  public loadModel(model: string, material?: string, transform?: number[]) {
    this.mode = 'model'
    this.world.getSystem(LevelSystem).loadModel(model, material, transform)
    this.teleport(0, 0, 0)
    this.onModeChanged.emit(this)
  }

  public loadMaterial(asset: string) {
    this.mode = 'material'
    this.world.getSystem(LevelSystem).loadMaterial(asset)
    this.teleport(0, 0, 0)
    this.onModeChanged.emit(this)
  }
}

/**
 * File name of a screenshot: level, position, size and time, e.g. `nw-viewer_newworld_vitaeeterna_5500_600_1920x1080_2026-10-11T12-00-00.png`
 */
/**
 * Mission cameras by role, the first found starts the view: the main menu's establishing shot, the menu camera of
 * older menus, the vista of FTUE levels. Else the first camera of the mission.
 */
const LEVEL_CAMERA_NAMES = ['EstablishingCameraPlacement', 'MainCamera', 'VistaCamera']

/**
 * The camera a level starts with (see {@link LEVEL_CAMERA_NAMES}). Null without one. Returns the world matrix.
 */
export function findLevelCamera(info: LevelInfo): Mat4 | null {
  const cameras = (info.missionEntities ?? []).filter((it) => it.components?.some(isViewerCameraComponent))
  const named = LEVEL_CAMERA_NAMES.map((name) => cameras.find((it) => it.name === name)).find((it) => !!it)
  const camera = named ?? cameras[0]
  return camera?.transform ? mat4CreateFromArray(camera.transform) : null
}

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

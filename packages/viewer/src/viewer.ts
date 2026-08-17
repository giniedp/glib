import {
  CameraComponent,
  EcsGame,
  KeyboardInputSystem,
  ModelComponent,
  MouseInputSystem,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'
import { GameEntity } from '@gglib/ecs'
import { CommonMaterial, IblSampler, SkyboxMaterial, TonemapOperator } from '@gglib/effects'
import { MouseListener } from '@gglib/game'
import {
  boxGeometry,
  Color,
  FALSE,
  ProgramInputBlock,
  ProgramInputBlockCollection,
  Texture,
  TRUE,
} from '@gglib/graphics'
import { DDS, GLTF, HDR, KTX } from '@gglib/loaders'
import { Mat3 } from '@gglib/math'
import { Model } from '@gglib/model'
import { BloomPass, TonemapPass } from '@gglib/render'

export interface ModelViewerOptions {
  canvas: HTMLCanvasElement
}

export interface LoadModelOptions {
  url: string
  baseUrl?: string
  signal?: AbortSignal
  environment?: EnvironmentOptions
}

export interface EnvironmentOptions {
  panoramaUrl: string
  showSkybox?: boolean
}

export class ModelViewer extends EcsGame {
  private stage: GameEntity
  private cam: GameEntity
  private sky: GameEntity

  private panoramaUrl: string
  private panoramaMap: Texture
  private iblSampler: IblSampler
  private iblRotation: Mat3 = Mat3.createIdentity()

  public bloomPass: BloomPass
  public tonemapPass: TonemapPass
  public iblIntensity = 1
  public iblBlur = 0.5

  public constructor(options: ModelViewerOptions) {
    super({
      canvas: options.canvas,
      autosize: true,
      platform: 'webgl2',
    })
  }

  protected override onCreate(): void {
    this.world.addSystem(
      new MouseInputSystem({
        provider: new MouseListener({
          captureTarget: this.device.canvas as any,
          eventTarget: this.device.canvas,
        }),
      }),
    )
    this.world.addSystem(new KeyboardInputSystem())
  }

  protected override onInitialize(): void {
    GLTF.Loader.registerExtension(GLTF.KhrMaterialsIor)
    GLTF.Loader.registerExtension(GLTF.KhrMaterialsPbrSpecularGlossinessHandler)
    GLTF.Loader.registerExtension(GLTF.KhrMaterialsSpecular)
    GLTF.Loader.registerExtension(GLTF.KhrMaterialsEmissiveStrength)

    this.content.registerLoader(GLTF.Loader)
    this.content.registerLoader(KTX.Loader)
    this.content.registerLoader(DDS.Loader)
    this.content.registerLoader(HDR.Loader)
    this.content.registerMaterial({
      match: () => true,
      create: (device, options) => {
        const material = new CommonMaterial(device, options)
        material.UseIBL = this.panoramaUrl ? TRUE : FALSE
        return material
      },
    })

    this.renderer.clearColor = Color.CornflowerBlue

    this.bloomPass = new BloomPass(this.device, {
      enabled: true,
      threshold: 0.75,
      intensity: 0.75,
    })

    this.renderer.pipeline.passes.push(this.bloomPass)

    this.tonemapPass = new TonemapPass(this.device, {
      enabled: true,
      operator: TonemapOperator.PBR_NEUTRAL,
      srgb: true,
    })
    this.renderer.pipeline.passes.push(this.tonemapPass)

    this.sky = this.createEntity({
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new ModelComponent()],
    })
    this.stage = this.createEntity({
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new ModelComponent()],
    })
    this.cam = this.createEntity({
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new CameraComponent(), new WASDComponent()],
    })
    this.view.camera = this.cam.component(CameraComponent)
  }

  protected override async onLoadContent(): Promise<void> {
    this.iblSampler = new IblSampler(this.device, {})
    await this.iblSampler.ready

    const skybox = boxGeometry(this.device, { name: 'Skybox', invert: true })
    const skymat = new SkyboxMaterial(this.device, {
      cubemap: this.iblSampler.envMapGGX,
      blur: 0.5,
      intensity: 1,
    })

    this.sky.component(ModelComponent).model = new Model(this.device, {
      meshes: [
        {
          geometries: [skybox],
          materials: [skymat],
          parts: [{ geometryIndex: 0, materialIndex: 0 }],
        },
      ],
    })
  }

  private abort: AbortController
  public async loadModel(options: LoadModelOptions) {
    await this.ready

    this.abort?.abort('reload')
    this.abort = new AbortController()
    if (options.environment?.panoramaUrl) {
      this.loadEnvironment(options.environment?.panoramaUrl)
    }
    const model = await this.content.loadModel(options.url, {
      baseUrl: options.baseUrl,
      signal: options.signal || this.abort.signal,
    })

    this.abort = null
    model.selectScene(0)

    const component = this.stage.component(ModelComponent)
    if (component.model) {
      component.model.dispose()
      component.model = null
    }
    component.model = model
    console.log(component)

    const radius = model.boundingSphere.radius
    let scale = 1
    if (radius > 0 && radius < 1) {
      scale = 1 / radius
    }
    this.stage.getTransform<TransformComponent>().setScaleUniform(scale)

    const wasd = this.cam.component(WASDComponent)
    wasd.orbitMode = true
    wasd.targetRadius = radius * scale * 2
    wasd.orbitCenter.initFrom(model.boundingSphere.center)
    return model
  }

  public async loadEnvironment(panoramaUrl: string) {
    if (this.panoramaUrl === panoramaUrl) {
      return
    }
    this.panoramaUrl = panoramaUrl
    this.panoramaMap = await this.content.loadTexture(this.panoramaUrl)
    this.iblSampler.update(this.panoramaMap)
  }

  protected override onBeginUpdate(time: number, dt: number) {
    const camera = this.cam.component(CameraComponent)
    camera.aspect = this.device.output.aspectRatio

    const sky = this.sky.component(ModelComponent).model.meshes[0].materials[0] as SkyboxMaterial
    sky.Blur = this.iblBlur
    sky.Intensity = this.iblIntensity

    const inputs = this.renderer.inputs
    inputs.createBlock('ibl')
    inputs.setByBlockAndName('ibl', 'intensity', this.iblIntensity)
    inputs.setByBlockAndName('ibl', 'rotation', this.iblRotation)
    inputs.setByBlockAndName('ibl', 'brdfMap', this.iblSampler.lutMapGGX)
    inputs.setByBlockAndName('ibl', 'radianceMap', this.iblSampler.envMapGGX)
    inputs.setByBlockAndName('ibl', 'irradianceMap', this.iblSampler.envMapLambert)
    inputs.setByBlockAndName('ibl', 'mipCount', this.iblSampler.envMapGGX.mipLevelCount)
  }
}

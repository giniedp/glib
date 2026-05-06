import { BasicGame, CameraComponent, ModelComponent } from '@gglib/components'
import { GameEntity } from '@gglib/ecs'
// import { IBLSamplerEffect } from '@gglib/effects'
import { DDS, GLTF, HDR, KTX } from '@gglib/loaders'
// import { AutoMaterial, SkyboxMaterial } from '@gglib/materials'

export interface GlibViewerOptions {
  canvas: HTMLCanvasElement
}

export interface LoadModelOptions {
  url: string
  baseUrl?: string
  signal?: AbortSignal
  environment?: EnvironmentOptions
}

export interface EnvironmentOptions {
  panoramaUrl?: string
  cubemapUrl?: string
  showSkybox?: boolean
}

export class GlibViewer extends BasicGame {
  // private iblSampler: IBLSamplerEffect

  private root: GameEntity
  private modelEntity: GameEntity
  private skyEntity: GameEntity
  private cameraEntity: GameEntity

  public constructor(options: GlibViewerOptions) {
    super({
      canvas: options.canvas,
    })
    this.content.registerLoader(GLTF.Loader)
    this.content.registerLoader(KTX.Loader)
    this.content.registerLoader(DDS.Loader)
    this.content.registerLoader(HDR.Loader)
    // this.content.registerMaterial(AutoMaterial, () => true)
    // this.root = createEntity({
    //   name: 'Root',
    //   components: [],
    // })
    // this.modelEntity = createEntity({
    //   name: 'Model',
    //   components: [new ModelComponent()],
    //   parent: this.root,
    // })
    // this.skyEntity = createEntity({
    //   name: 'Sky',
    //   components: [new ModelComponent()],
    //   parent: this.root,
    // })
    // this.cameraEntity = createEntity({
    //   name: 'Camera',
    //   parent: this.root,
    //   components: [
    //     new CameraComponent({
    //       type: 'perspective',
    //     }),
    //   ],
    // })
    //this.camera.activate(this.cameraEntity.component(CameraComponent))

    // const device = this.get(Device)
    // this.skyEntity.component(ModelComponent).model = new Model(device, {
    //   name: 'Skybox',
    //   meshes: [
    //     {
    //       parts: [cubeGeometry(device)],
    //       materials: [
    //         new SkyboxMaterial(device, {
    //           parameters: {},
    //         }),
    //       ],
    //     },
    //   ],
    // })
    // this.scene.add(this.root)
    // this.run()
  }

  // public override update(time: LoopTime): void {
  //   super.update(time)
  //   const device = this.get(Device)
  //   const camera = this.cameraEntity.component(CameraComponent)
  //   camera.aspect = device.output.aspectRatio
  // }

  // public async load(options: LoadModelOptions) {
  //   if (options.environment) {
  //     this.updateEnvironment(options.environment)
  //   }
  //   const model = await this.content.loadModel(options.url, {
  //     baseUrl: options.baseUrl,
  //     signal: options.signal,
  //   })
  //   const component = this.modelEntity.component(ModelComponent)
  //   if (component.model) {
  //     component.model.dispose()
  //     component.model = null
  //   }
  //   component.model = model
  // }

  // public async updateEnvironment(options: EnvironmentOptions) {
  //   if (!this.iblSampler) {
  //     this.iblSampler = new IBLSamplerEffect(this.get(Device))
  //   }
  //   if (options.panoramaUrl) {
  //     this.iblSampler.panoramaInput?.dispose()
  //     this.iblSampler.panoramaInput = null
  //     this.iblSampler.panoramaInput = await this.content.loadTexture(options.panoramaUrl)
  //     this.iblSampler.needsUpdate = true
  //   }
  //   if (options.cubemapUrl) {
  //     this.iblSampler.cubemapInput?.dispose()
  //     this.iblSampler.panoramaInput = null
  //     this.iblSampler.cubemapInput = await this.content.loadTexture(options.cubemapUrl)
  //     this.iblSampler.needsUpdate = true
  //   }
  // }

  // public dispose() {
  //   this.stop()
  //   // this.content.dispose()
  // }
}

import {
  EcsGame,
  CameraComponent,
  KeyboardInputSystem,
  MouseInputSystem,
  SceneComponent,
  SpriteComponent,
  TransformComponent,
  type SceneStats,
} from '@gglib/components'
import { Color, SpriteBatch, Texture, type DeviceStats } from '@gglib/graphics'
import { DDS, GLTF, HDR, KTX } from '@gglib/loaders'
import { SpaceBasis } from '@gglib/math'
import { type RendererStats } from '@gglib/render'

import type { GameEntity } from '@gglib/ecs'
import { ContentService } from './content'
import { DebugShapeSystem } from './game/debug/DebugShapeSystem'
import { InputSlots, NwMaterialExtension } from './material'

export interface NwViewerOptions {
  element: HTMLDivElement
  canvas: HTMLCanvasElement
}

export class NwImageViewer extends EcsGame {
  public camera: CameraComponent

  public deviceStats: DeviceStats
  public sceneStats: SceneStats
  public renderStats: RendererStats

  public debug: number = 0

  public spriteEntity: GameEntity
  public spriteComponent: SpriteComponent
  public texture: Texture
  public spriteBatch: SpriteBatch
  public mipLevel: number
  public mipLevelCount: number
  public face: number
  public faceCount: number

  private zoom = 1
  private scale = 1
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
    this.renderer.clearColor = Color.Black.toLinear()

    GLTF.Loader.registerExtension(NwMaterialExtension)
    GLTF.Loader.registerExtension(GLTF.KhrMaterialsSpecular)

    this.content.registerLoader(GLTF.Loader)
    this.content.registerLoader(KTX.Loader)
    this.content.registerLoader(DDS.Loader)
    this.content.registerLoader(HDR.Loader)

    this.renderer.clearColor = Color.Black
    this.renderer.autoSrgb = true
    this.spriteEntity = this.createEntity({
      parent: this.scene,
      transform: new TransformComponent({}),
      components: [new SpriteComponent()],
    })
    this.spriteComponent = this.spriteEntity.component(SpriteComponent)

    const camera = this.createEntity({
      name: 'Camera',
      parent: this.scene,
      transform: new TransformComponent({
        keepWorld: true,
      }),
      components: [
        new CameraComponent({
          type: 'orthographic',
          orthographicScale: this.scale,
          aspect: this.device.output.aspectRatio,
          near: 0,
          far: 1,
        }),
      ],
    })
    this.camera = camera.component(CameraComponent)

    this.view.camera = camera.component(CameraComponent)
  }

  protected override onCreate(): void {
    this.world.addSystem(SpaceBasis.Z_UP_POS_Y)
    this.world.addSystem(new ContentService())
    this.world.addSystem(new KeyboardInputSystem())
    this.world.addSystem(new MouseInputSystem({}))
    this.world.addSystem(new DebugShapeSystem())
  }

  override onUpdate(time: number, dt: number): void {
    super.onUpdate(time, dt)
    this.device.resize()
    this.camera.aspect = this.device.output.aspectRatio
    this.camera.orthographicScale = this.scale
    this.renderer.inputs.set(InputSlots.Global.Debug, this.debug)
  }

  override onDraw(time: number, dt: number): void {
    super.onDraw(time, dt)
    this.deviceStats = this.device.stats(this.deviceStats)
    this.sceneStats = this.scene.component(SceneComponent).stats(this.sceneStats)
    this.renderStats = this.renderer.stats(this.renderStats)
  }

  public dispose() {
    this.stop()
  }

  public async load(image: string) {
    const content = this.world.getSystem(ContentService)
    const texture = await content.loadTexture(image)
    this.texture = texture
    this.mipLevel = 0
    this.mipLevelCount = texture.mipLevelCount
    this.face = 0
    this.faceCount = texture.depth
    this.scale = Math.max(texture.width, texture.height)
    this.spriteComponent.setTexture(texture)
    this.spriteComponent.setSource(0, 0, texture.width, texture.height)
    this.spriteComponent.setSize(texture.width, texture.height)
    this.spriteComponent.setPivot(0.5, 0.5)
    console.log(texture)
  }
}

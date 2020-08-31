import { createGame, RendererComponent, SpriteComponent } from '@gglib/components'
import * as TweakUi from 'tweak-ui'

import { ContentManager } from '@gglib/content'
import { Inject, OnInit, OnUpdate, Component } from '@gglib/ecs'
import { Texture, BlendState } from '@gglib/graphics'
import { BasicRenderStep, CameraData } from '@gglib/render'
import { Mat4 } from '@gglib/math'

@Component({
  install: [RendererComponent, SpriteComponent],
})
class MyGame implements OnInit, OnUpdate {
  @Inject(RendererComponent)
  public readonly renderer: RendererComponent

  @Inject(ContentManager)
  public readonly content: ContentManager

  @Inject(SpriteComponent)
  public readonly sprite: SpriteComponent

  // 21/9 aspect ration with 210 units in width
  // and 90 units in height
  public readonly width = 210
  public readonly height = 90

  // The camera convers the whole 210x90 units area
  public readonly camera: CameraData = {
    view: Mat4.createIdentity(),
    projection: Mat4.createOrthographicOffCenter(
      -this.width / 2,
      this.width / 2,
      -this.height / 2,
      this.height / 2,
      0,
      100,
    ),
  }

  public async onInit() {
    this.renderer.scene.camera = this.camera
    const renderStep = this.renderer.scene.steps[0] as BasicRenderStep
    renderStep.blendState = BlendState.AlphaBlend
    renderStep.clearColor = 0xff2e2620

    this.sprite.width = 45
    this.sprite.height = 45
    this.sprite.pivotX = 0.5
    this.sprite.pivotY = 0.5
    this.sprite.texture = await this.content.load('/assets/textures/puzzle/interface_sheet.png', Texture.Texture2D)
    this.sprite.source = {
      x: 528,
      y: 374,
      width: 128,
      height: 128,
    }
    this.sprite.slice = {
      top: 24,
      right: 24,
      bottom: 24,
      left: 24,
    }

    TweakUi.build('#tweak-ui', (q) => {
      q.group('SpriteComponent', { open: true }, (b) => {
        b.slider(this.sprite, 'width', { min: 1, max: 90, step: 1 })
        b.slider(this.sprite, 'height', { min: 1, max: 90, step: 1 })
        b.slider(this.sprite, 'pivotX', { min: 0, max: 1, step: 0.1 })
        b.slider(this.sprite, 'pivotY', { min: 0, max: 1, step: 0.1 })
        b.checkbox(this.sprite, 'flipX')
        b.checkbox(this.sprite, 'flipY')
        b.checkbox(this.sprite, 'enableSlicing')
        b.checkbox(this.sprite, 'enableTiling')
      })
    })
  }

  public onUpdate() {
    this.sprite.unitPixels = this.renderer.device.drawingBufferHeight / this.height
  }
}

createGame({
  device: { canvas: '#canvas' },
  autorun: true,
}).install(MyGame)

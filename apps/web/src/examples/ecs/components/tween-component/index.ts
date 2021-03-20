import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TransformComponent,
  TweenComponent,
  TweenOptions,
  Tween,
} from '@gglib/ecs-components'
import * as TweakUi from 'tweak-ui'

import { ContentManager } from '@gglib/content'
import { Entity, Inject, OnInit, OnUpdate, Component, OnAdded } from '@gglib/ecs'
import { Model, LightType } from '@gglib/graphics'
import { easeLinear, easeInCubic, easeOutCubic, easeInOutCubic, Vec3 } from '@gglib/math'

@Component({
  install: [RendererComponent, PerspectiveCameraComponent],
})
class MyGame implements OnAdded, OnInit, OnUpdate {
  public name = 'MyGame'

  @Inject(RendererComponent)
  public readonly renderer: RendererComponent

  @Inject(CameraComponent)
  public readonly camera: PerspectiveCameraComponent

  public onAdded(e: Entity) {
    e.createChild((e) => {
      e.name = 'Light'
      e.install(LightComponent, { type: LightType.Directional })
      e.get(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
    })
    e.createChild((e) => {
      e.install(CubeComponent)
      e.get(TransformComponent).setPositionZ(-5)
    })
  }

  public onInit() {
    this.renderer.scene.camera = this.camera
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.view.viewport.aspect
  }
}

@Component({
  install: [ModelComponent, TransformComponent, TweenComponent],
})
class CubeComponent implements OnInit {
  public name = 'Cube'

  @Inject(ModelComponent)
  public renderable: ModelComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  @Inject(TweenComponent)
  public tween: TweenComponent

  public async onInit() {
    this.renderable.model = await this.content.load('/assets/models/obj/cube.obj', Model)

    TweakUi.mount('#tweak-ui', (ui) => {
      const positionOptions: TweenOptions<any> = {
        from: null,
        to: null,
        durationInMs: 500,
        delayInMs: 0,
        ease: easeInOutCubic,
      }
      ui.number(positionOptions, 'durationInMs', { min: 100, step: 1 })
      ui.number(positionOptions, 'delayInMs', { min: 0, step: 1 })
      ui.select(positionOptions, 'ease', {
        options: [
          { label: 'Linear', value: easeLinear },
          { label: 'InCubic', value: easeInCubic },
          { label: 'OutCubic', value: easeOutCubic },
          { label: 'InOutCubic', value: easeInOutCubic },
        ],
      })
      ui.button('Move', { onClick: () => this.tweenPosition(positionOptions) })
      const scaleOptions: TweenOptions<any> = {
        from: null,
        to: null,
        durationInMs: 500,
        delayInMs: 0,
        ease: easeInOutCubic,
      }
      ui.number(scaleOptions, 'durationInMs', { min: 100, step: 1 })
      ui.number(scaleOptions, 'delayInMs', { min: 0, step: 1 })
      ui.select(scaleOptions, 'ease', {
        options: [
          { label: 'Linear', value: easeLinear },
          { label: 'InCubic', value: easeInCubic },
          { label: 'OutCubic', value: easeOutCubic },
          { label: 'InOutCubic', value: easeInOutCubic },
        ],
      })
      ui.button('Scale', { onClick: () => this.tweenScale(scaleOptions) })
    })
  }

  public tweenPosition(options: TweenOptions<any>) {
    this.tween
      .startV3({
        ...options,
        from: this.transform.position,
        to: Vec3.create(this.transform.position.x > 0 ? -5 : 5, 0, -5),
      })
      .addUpdatableWith3Args(this.transform, 'setPosition')
  }
  public tweenScale(options: TweenOptions<any>) {
    this.tween
      .start({
        ...options,
        from: [this.transform.scale.x],
        to: [this.transform.scale.x > 1 ? 0.5 : 2],
      })
      .addUpdatableWith1Arg(this.transform, 'setScaleUniform')
  }
}

createGame({ device: { canvas: '#canvas' } }).install(MyGame)

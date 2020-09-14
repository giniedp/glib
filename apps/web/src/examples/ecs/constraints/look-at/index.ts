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
  LookAtConstraint,
} from '@gglib/ecs-components'
import * as TweakUi from 'tweak-ui'

import { ContentManager } from '@gglib/content'
import { Entity, Inject, OnInit, OnUpdate, Component, OnAdded } from '@gglib/ecs'
import { Model, LightType } from '@gglib/graphics'
import { easeLinear, easeInCubic, easeOutCubic, easeInOutCubic, Vec3 } from '@gglib/math'

@Component({
  install: [ModelComponent, TransformComponent],
})
class CubeComponent implements OnInit {
  public name = 'Cube'

  @Inject(ModelComponent)
  public renderable: ModelComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  public async onInit() {
    this.renderable.model = await this.content.load('/assets/models/obj/cube.obj', Model)
  }
}

@Component({
  install: [RendererComponent, PerspectiveCameraComponent],
})
class MyGame implements OnAdded, OnInit, OnUpdate {
  @Inject(Entity)
  public readonly entity: Entity

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
    e.createChild((c1) => {
      c1.name = 'Cube1'
      c1.install(CubeComponent)
      c1.install(LookAtConstraint)
      c1.get(TransformComponent).setPositionZ(-5)
    })
    e.createChild((c2) => {
      c2.name = 'Cube2'
      c2.install(CubeComponent)
      c2.get(TransformComponent).setPosition(5, 0, -5).setScaleUniform(0.1)

      TweakUi.build('#tweak-ui', (q) => {
        q.button('Move', {
          onClick: () => {
            const pos = Vec3.createRandom().subtractScalar(0.5).normalize().multiplyScalar(5)
            pos.z -= 5
            c2.get(TransformComponent).setPositionV(pos)
          },
        })
      })
    })
  }

  public onInit() {
    this.renderer.scene.camera = this.camera

    const c1 = this.entity.find('/Cube1')
    const c2 = this.entity.find('/Cube2')

    c1.get(LookAtConstraint).source = c2.get(TransformComponent)
    c1.get(LookAtConstraint).weight = 0.5
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.view.viewport.aspect
  }
}

createGame({ device: { canvas: '#canvas' } }).install(MyGame)

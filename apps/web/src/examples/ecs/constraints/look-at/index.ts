import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TransformComponent,
  LookAtConstraint,
} from '@gglib/ecs-components'

import { ContentManager } from '@gglib/content'
import { Entity, Inject, OnInit, OnUpdate, Component, OnAdded } from '@gglib/ecs'
import { Model, LightType } from '@gglib/graphics'

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
  install: [TransformComponent],
})
class TargetComponent implements OnUpdate {
  public name = 'Target'

  @Inject(TransformComponent)
  public transform: TransformComponent

  private time: number = 0

  public onUpdate(dt: number) {
    this.time += dt
    this.transform
      .setPositionX(Math.sin(this.time / 2000) * 21 * 0.4)
      .setPositionY(Math.sin(this.time / 1000) * 9 * 0.4)
  }
}

@Component({
  install: [RendererComponent, PerspectiveCameraComponent],
})
class ExampleGame implements OnAdded, OnInit, OnUpdate {
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
    const w = 10
    const h = 5
    for (let y = 0; y <= h; y++) {
      for (let x = 0; x <= w; x++) {
        e.createChild((c1) => {
          c1.name = `Cube`
          c1.install(CubeComponent)
          c1.install(LookAtConstraint)
          c1.get(TransformComponent)
            .setPosition(x - w/2, y - h/2, -8)
            .setScaleUniform(0.4)
        })
      }
    }
    e.createChild((c2) => {
      c2.name = 'Target'
      c2.install(CubeComponent)
      c2.install(TargetComponent)
      c2.get(TransformComponent).setPosition(0, 0, -5).setScaleUniform(0.1)
    })
  }

  public onInit() {
    this.renderer.scene.camera = this.camera

    const cubes = this.entity.findAll('/Cube')
    const target = this.entity.find('/Target')
    for (const cube of cubes) {
      cube.get(LookAtConstraint).source = target.get(TransformComponent)
      cube.get(LookAtConstraint).weight = 0.5
    }
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.view.viewport.aspect
  }
}

createGame({ device: { canvas: '#canvas' } }).install(ExampleGame)

import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TransformComponent,
  DistanceConstraint,
} from '@gglib/ecs-components'

import { ContentManager } from '@gglib/content'
import { Entity, Inject, OnInit, OnUpdate, Component, OnAdded } from '@gglib/ecs'
import { Model, LightType } from '@gglib/graphics'

@Component({
  install: [ModelComponent, TransformComponent],
})
class ShapeComponent implements OnInit {
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
    let head: Entity
    e.createChild((child) => {
      head = child
      child.name = 'Head'
      child.install(ShapeComponent)
      child.install(TargetComponent)
      child.get(TransformComponent)
        .setPosition(0, 0, -8)
        .setScaleUniform(0.4)
    })
    let body: Entity
    for (let i = 0; i < 10; i++) {
      e.createChild((child) => {
        child.name = `Body`
        child.install(ShapeComponent)
        child.install(DistanceConstraint, {
          source: (body || head).get(TransformComponent),
          sourceSpace: 'world',
          targetSpace: 'world',
          minDistance: 0,
          maxDistance: 1,
          weight: 0.1
        })
        child.get(TransformComponent)
          .setPosition(0, 0, -8)
          .setScaleUniform(0.4)
        body = child
      })
    }
  }

  public onInit() {
    this.renderer.scene.camera = this.camera
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.view.viewport.aspect
  }
}

createGame({ device: { canvas: '#canvas' } }).install(ExampleGame)


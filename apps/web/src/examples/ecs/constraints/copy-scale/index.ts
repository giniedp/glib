import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TransformComponent,
  CopyRotationConstraint,
  CopyScaleConstraint,
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
      .setScale(
        1 + Math.sin(this.time / 2000) * 0.5,
        1 + Math.sin(this.time / 2000) * 0.5,
        1 + Math.sin(this.time / 2000) * 0.5
      )
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
    e.createChild((child) => {
      child.name = 'Light'
      child.install(LightComponent, { type: LightType.Directional })
      child.get(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
    })

    let source: Entity
    e.createChild((child) => {
      source = child
      child.name = 'Target'
      child.install(CubeComponent)
      child.install(TargetComponent)
      child.get(TransformComponent)
        .setPosition(0, 2, -8)
    })

    for (let i = -1; i < 2; i++) {
      e.createChild((child) => {
        child.name = 'Child'
        child
          .install(CubeComponent)
          .install(CopyScaleConstraint, {
            source: source.get(TransformComponent),
            copyX: i === -1,
            copyY: i === 0,
            copyZ: i === 1,
            weight: 0.1
          })
          .get(TransformComponent)
          .setPosition(i * 5, -2, -8)
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

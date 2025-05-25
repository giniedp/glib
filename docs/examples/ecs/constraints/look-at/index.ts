import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererSystem,
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
  install: [RendererSystem, PerspectiveCameraComponent],
})
class ExampleGame implements OnAdded, OnInit, OnUpdate {
  @Inject(Entity)
  public readonly entity: Entity

  @Inject(RendererSystem)
  public readonly renderer: RendererSystem

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
      child
        .install(CubeComponent)
        .install(TargetComponent)
        .get(TransformComponent)
        .setPosition(0, 0, -5)
        .setScaleUniform(0.1)
    })
    const w = 10
    const h = 5
    for (let y = 0; y <= h; y++) {
      for (let x = 0; x <= w; x++) {
        e.createChild((child) => {
          child.name = `Cube`
          child
            .install(CubeComponent)
            .install(LookAtConstraint, {
              source: source.get(TransformComponent),
              weight: 0.5,
            })
            .get(TransformComponent)
            .setPosition(x - w / 2, y - h / 2, -8)
            .setScaleUniform(0.4)
        })
      }
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

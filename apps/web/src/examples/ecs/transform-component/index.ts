import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TransformComponent,
} from '@gglib/ecs-components'
import * as TweakUi from 'tweak-ui'

import { ContentManager } from '@gglib/content'
import { Entity, Inject, OnInit, OnUpdate, Component } from '@gglib/ecs'
import { Model, LightType } from '@gglib/graphics'

@Component({
  install: [
    RendererComponent
  ]
})
class MyGame implements OnInit, OnUpdate {

  public name = 'MyGame'

  @Inject(RendererComponent)
  public readonly renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  public readonly camera: PerspectiveCameraComponent

  public onInit() {
    this.renderer.scene.camera = this.camera
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.view.viewport.aspect
  }
}

@Component({
  install: [
    ModelComponent,
    TransformComponent
  ]
})
class CubeComponent implements OnInit, OnUpdate {

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

  public onUpdate(dt: number) {
    this.transform.rotateAxisAngle(0, 1, 0, dt / 2000)
  }
}

function buildCube(e: Entity, x: number, y: number, z: number) {
  e.install(CubeComponent)
  e.get(TransformComponent).setPosition(x, y, z)
  return e
}

createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}, (e) => {
  e.install(RendererComponent)
  e.install(MyGame)
})
.createChild((e) => {
  e.name = 'Camera'
  e.install(PerspectiveCameraComponent)
})
.createChild((e) => {
  e.name = 'Light'
  e.install(LightComponent, { type: LightType.Directional })
  e.get(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
})
.createChild((e) => {
  buildCube(e, 0, 0, -10)
  e.createChild((e) => {
    buildCube(e, 0, 3, 0)
    e.createChild((e) => {
      buildCube(e, 0, 3, 0)
    })
  })

  e.createChild((e) => {
    buildCube(e, 0, -3, 0)
    e.createChild((e) => {
      buildCube(e, 0, -3, 0)
    })
  })

  e.createChild((e) => buildCube(e, 3, 0, 0))
  e.createChild((e) => buildCube(e, -3, 0, 0))
})

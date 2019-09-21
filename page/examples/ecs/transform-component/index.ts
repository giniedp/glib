import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TransformComponent,
} from '@gglib/components'

import { ContentManager } from '@gglib/content'
import { Entity, Inject, OnInit, OnUpdate, Service } from '@gglib/ecs'
import { Model } from '@gglib/graphics'

class MyGame implements OnInit, OnUpdate {

  public name = 'MyGame'

  @Inject(RendererComponent)
  public readonly renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  public readonly camera: PerspectiveCameraComponent

  public onInit() {
    this.renderer.manager.getScene(0).camera = this.camera
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.manager.getScene(0).viewport.aspect
  }
}

@Service()
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
  ModelComponent.ensure(e)
  e.addComponent(new CubeComponent())
  e.getService(TransformComponent).setPosition(x, y, z)
  return e
}

createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}, (e) => {
  e.addComponent(new RendererComponent())
  e.addComponent(new MyGame())
})
.createChild((e) => {
  e.name = 'Camera'
  PerspectiveCameraComponent.ensure(e)
})
.createChild((e) => {
  e.name = 'Light'
  LightComponent.addDirectionalLight(e)
  e.getService(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
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

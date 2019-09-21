import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TimeComponent,
  TransformComponent,
} from '@gglib/components'

import { ContentManager } from '@gglib/content'
import { Inject, OnInit, OnUpdate, Service } from '@gglib/ecs'
import { Model } from '@gglib/graphics'
import * as TweakUi from 'tweak-ui'

class MyGame implements OnInit, OnUpdate {

  @Inject(RendererComponent)
  public readonly renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  public readonly camera: PerspectiveCameraComponent

  @Inject(TimeComponent, { from: 'root' })
  public readonly time: TimeComponent

  public onInit() {
    this.renderer.manager.getScene(0).camera = this.camera
    this.time.getOrCreate('time1')
    this.time.getOrCreate('time2')
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.manager.getScene(0).viewport.aspect
  }
}

@Service()
class CubeComponent implements OnInit, OnUpdate {

  @Inject(TimeComponent, { from: 'root' })
  public readonly time: TimeComponent

  @Inject(ContentManager, { from: 'root' })
  public readonly content: ContentManager

  @Inject(ModelComponent)
  public readonly model: ModelComponent

  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  public constructor(private timeKey: string) {
    //
  }

  public async onInit() {
    this.model.model = await this.content.load('/assets/models/obj/cube.obj', Model)
  }

  public onUpdate() {
    const dt = this.time.getOrCreate(this.timeKey).elapsedMs
    this.transform.rotateYawPitchRoll(dt / 2000, dt / 4000, dt / 8000)
  }
}

const game = createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}, (e) => {
  e.name = 'Root'
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
  ModelComponent.ensure(e)
  e.name = 'Cube1'
  e.addComponent(new CubeComponent('time1'))
  e.getService(TransformComponent).translate(-2, 0, -5)
})
.createChild((e) => {
  ModelComponent.ensure(e)
  e.name = 'Cube2'
  e.addComponent(new CubeComponent('time2'))
  e.getService(TransformComponent).translate(2, 0, -5)
})

TweakUi.build('#tweak-ui', (q) => {
  q.group('Time 1', (f) => {
    const t = game.getService(TimeComponent).getOrCreate('time1')
    f.slider(t, 'factor', { min: -10, max: 10, step: 0.1 })
  })
  q.group('Time 2', (f) => {
    const t = game.getService(TimeComponent).getOrCreate('time2')
    f.slider(t, 'factor', { min: -10, max: 10, step: 0.1 })
  })
})

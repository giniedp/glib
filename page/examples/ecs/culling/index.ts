import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  OccTree,
  PerspectiveCameraComponent,
  RendererComponent,
  SpatialCullVisitor,
  SpatialSystemComponent,
  TimeComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'

import { ContentManager } from '@gglib/content'
import { Entity, Inject, OnInit, OnUpdate, Service } from '@gglib/ecs'
import { Model } from '@gglib/graphics'
import { Vec3 } from '@gglib/math'

class MyGame implements OnInit, OnUpdate {

  @Inject(RendererComponent)
  public renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  private camera1: PerspectiveCameraComponent

  @Inject(CameraComponent, { from: '/Camera2' })
  private camera2: PerspectiveCameraComponent

  public onInit() {
    this.renderer.scene.views = [{
      camera: this.camera1,
      viewport: { type: 'normalized', x: 0.0, y: 0.0, width: 1, height: 1 },
    }, {
      camera: this.camera2,
      viewport: { type: 'normalized', x: 0.75, y: 0.0, width: 0.25, height: 0.25 },
    }]
  }

  public onUpdate() {
    this.camera1.aspect = this.renderer.scene.views[0].viewport.aspect
    this.camera2.aspect = this.renderer.scene.views[1].viewport.aspect
  }
}

@Service()
class CubeComponent implements OnInit {

  public name = 'Cube'

  @Inject(Entity)
  public entity: Entity

  @Inject(ModelComponent)
  public renderable: ModelComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  @Inject(TimeComponent, { from: 'root' })
  public time: TimeComponent

  public async onInit() {
    this.renderable.model = await this.content.load('/assets/models/obj/cube.obj', Model)
  }

}

const game = createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}, (e) => {
  e.name = 'Root'
  e.addComponent(new SpatialSystemComponent({
    system: OccTree.create(Vec3.create(-512, -512, -512), Vec3.create(512, 512, 512), 6),
  }))
  e.addComponent(new RendererComponent({
    cullVisitor: new SpatialCullVisitor(),
  }))
  e.addComponent(new MyGame())
})
  .createChild((e) => {
    e.name = 'Camera'
    WASDComponent.ensure(e)
    PerspectiveCameraComponent.ensure(e)
    e.getService(TransformComponent).setPosition(0, 0, 5)
  })
  .createChild((e) => {
    e.name = 'Camera2'
    PerspectiveCameraComponent.ensure(e)
    e.getService(TransformComponent).setPosition(0, 0, 100)
  })
  .createChild((e) => {
    e.name = 'Light'
    LightComponent.addDirectionalLight(e)
    e.getService(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
  })

for (let x = 0; x <= 10; x++) {
  for (let y = 0; y <= 10; y++) {
    for (let z = 0; z <= 10; z++) {
      game.createChild((e) => {
        ModelComponent.ensure(e)
        e.name = 'Cube1'

        e.addComponent(new CubeComponent())
        e.getService(TransformComponent).setPosition((x - 5) * 10, (y - 5) * 10, (z - 5) * 10)
      })
    }
  }
}

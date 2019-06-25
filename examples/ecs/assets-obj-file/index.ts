import { ContentManager } from '@gglib/content'
import {
  addCamera,
  addDirectionalLight,
  addModel,
  addWASD,
  CameraComponent,
  createGame,
  Entity,
  ModelComponent,
  OnInit,
  OnUpdate,
  TimeComponent,
  TransformComponent,
} from '@gglib/ecs'
import { Model } from '@gglib/graphics'

class DemoComponent implements OnInit, OnUpdate {

  private index: number
  private total: number

  private time: TimeComponent
  private content: ContentManager
  private transform: TransformComponent
  private renderable: ModelComponent

  constructor(options: { index: number, total: number }) {
    this.index = options.index
    this.total = options.total
  }

  public onInit(entity: Entity) {
    this.time = entity.root.getService(TimeComponent)
    this.content = entity.root.getService(ContentManager)
    this.transform = entity.getService(TransformComponent)
    this.renderable = entity.getService(ModelComponent)

    this.content
      .load('/assets/models/obj/cube.obj', Model)
      .then((model) => {
        this.renderable.model = model
      })
  }

  public onUpdate() {
    let s = this.index / this.total
    let t = (s + this.time.totalMsInGame / 3000) * Math.PI * 2
    let x = Math.sin(s * Math.PI * 2) * 5
    let y = Math.cos(s * Math.PI * 2) * 5

    this.transform.setPositionXYZ(x, y, Math.sin(t) * 2 - 10)
    this.transform.setScaleUniform(0.75 + Math.sin(t) * 0.25)
    this.transform.setRotationXYZAngle(0, 1, 0, t)
  }
}

const game = createGame({
    canvas: document.getElementById('canvas'),
    autorun: true,
  })
  .createChild(addCamera, addWASD, (entity) => {
    entity.getService(CameraComponent).activate()
    entity.getService(TransformComponent).translateXYZ(0, 0, 5)
  })
  .createChild(addDirectionalLight)
  .createChild((e) => {
    e.name = 'Objects'
    const totalItems = 12
    for (let i = 1; i <= totalItems; i++) {
      e.createChild(addModel, (entity) => {
        entity.addComponent(new DemoComponent({index: i, total: totalItems}))
      })
    }
  })

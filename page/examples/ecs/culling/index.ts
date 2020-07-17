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
  BoundingVolumeComponent,
} from '@gglib/components'

import { Entity, Inject, OnInit, OnUpdate, Component, OnSetup } from '@gglib/ecs'
import { Model, LightType, ModelBuilder, buildIcosahedron, Device, TextureWrapMode, Color } from '@gglib/graphics'
import { Vec3, IVec3 } from '@gglib/math'
import { defaultProgram, AutoMaterial } from '@gglib/effects'
import { BasicRenderStep } from '@gglib/render'

@Component({ })
class MyGame implements OnInit, OnUpdate {
  @Inject(Device)
  public device: Device

  @Inject(RendererComponent)
  public renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  private camera1: PerspectiveCameraComponent

  @Inject(CameraComponent, { from: '/Camera2' })
  private camera2: PerspectiveCameraComponent

  public model: Model

  public onInit() {
    const material = new AutoMaterial(this.device)
    material.DiffuseColor = [1, 0.5, 0]
    material.SpecularColor = [0, 0.5, 1]
    material.SpecularPower = 16
    material.AmbientColor = [0.3, 0.3, 0.3]
    material.LightCount = 1
    material.ShadeFunction = 'shadeBlinn'

    this.model = new ModelBuilder()
      .append(buildIcosahedron, { radius: 1, tesselation: 0 })
      .calculateNormals(true)
      .calculateBoundings()
      .endModel(this.renderer.device, {
        materials: [material],
      })

    const step = this.renderer.scene.steps[0] as BasicRenderStep
    step.clearColor = Color.CornflowerBlue.rgba
    this.renderer.scene.views = [
      {
        camera: this.camera1,
        viewport: { type: 'normalized', x: 0.0, y: 0.0, width: 1, height: 1 },
      },
      {
        camera: this.camera2,
        viewport: { type: 'normalized', x: 0.75, y: 0.0, width: 0.25, height: 0.25 },
      },
    ]
  }

  public onUpdate() {
    this.camera1.aspect = this.renderer.scene.views[0].viewport.aspect
    this.camera2.aspect = this.renderer.scene.views[1].viewport.aspect
  }
}

@Component({
  install: [BoundingVolumeComponent, ModelComponent],
})
class ObjectComponent implements OnSetup<IVec3>, OnInit, OnUpdate {
  public name = 'Object'

  @Inject(Entity)
  public entity: Entity

  @Inject(ModelComponent)
  public renderable: ModelComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(TimeComponent, { from: 'root' })
  public time: TimeComponent

  @Inject(MyGame, { from: 'root' })
  public game: MyGame

  private options: IVec3 = { x: 0, y: 0, z: 0 }

  public onSetup(options: IVec3) {
    this.options = options
  }

  public async onInit() {
    this.transform.setPositionV(this.options)
    this.renderable.model = this.game.model
  }

  public onUpdate() {
    this.transform.setPositionX(this.options.x + Math.sin(this.options.x / 10 + this.time.game.totalMs / 1000))
    this.transform.setPositionY(this.options.y + Math.sin(this.options.y / 10 + this.time.game.totalMs / 2000))
    this.transform.setPositionZ(this.options.z + Math.sin(this.options.z / 10 + this.time.game.totalMs / 3000))
    this.transform.rotateAxisAngle(0, 1, 0, this.time.game.elapsedMs / 2000)
  }
}

const game = createGame(
  {
    device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
    autorun: true,
  },
  (e) => {
    e.name = 'Root'
    e.addComponent(
      new SpatialSystemComponent({
        system: OccTree.create(Vec3.create(-512, -512, -512), Vec3.create(512, 512, 512), 6),
      }),
    )
    e.addComponent(
      new RendererComponent({
        cullVisitor: new SpatialCullVisitor(),
      }),
    )
    e.addComponent(new MyGame())
  },
)
  .createChild((e) => {
    e.name = 'Camera'
    e.install(WASDComponent)
    e.install(PerspectiveCameraComponent)
    e.install(LightComponent, { type: LightType.Directional })
    e.get(TransformComponent).setPosition(0, 0, 5)
  })
  .createChild((e) => {
    e.name = 'Camera2'
    e.install(PerspectiveCameraComponent)
    e.get(TransformComponent).setPosition(0, 0, 100)
  })

for (let x = 0; x <= 10; x++) {
  for (let y = 0; y <= 10; y++) {
    for (let z = 0; z <= 10; z++) {
      game.createChild((e) => {
        e.name = `Object-${x}-${y}-${z}`
        e.install(ObjectComponent, {
          x: (x - 5) * 10,
          y: (y - 5) * 10,
          z: (z - 5) * 10,
        })
      })
    }
  }
}

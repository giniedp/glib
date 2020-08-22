import {
  CameraComponent,
  createGame,
  KeyboardComponent,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'

import {
  Entity,
  Inject,
  OnDestroy,
  OnInit,
  OnUpdate,
  Component,
  OnAdded,
  forwardRef,
} from '@gglib/ecs'

import { ContentManager } from '@gglib/content'
import { Device, Model, LightType, Color } from '@gglib/graphics'

import { KeyboardKey } from '@gglib/input'
import { Vec3 } from '@gglib/math'
import Ammo from 'ammojs-typed'
import { BasicRenderStep } from '@gglib/render'

@Component({
  install: [
    KeyboardComponent,
    forwardRef(() => PhysicsWorld),
    RendererComponent,
  ]
})
class MyGame implements OnAdded, OnInit, OnUpdate {
  public name = 'MyGame'

  @Inject(Entity)
  public entity: Entity

  @Inject(RendererComponent)
  public renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  private camera: PerspectiveCameraComponent

  @Inject(Device)
  public device: Device

  @Inject(KeyboardComponent)
  public keyboard: KeyboardComponent


  public onAdded(entity: Entity) {
    entity.createChild(
      (e) => {
        e.name = 'Camera'
        e.install(PerspectiveCameraComponent)
        e.install(WASDComponent)
        e.get(TransformComponent).setPosition(0, 25, 50)
      },
    )
    .createChild(
      (e) => {
        e.name = 'Light'
        e.install(TransformComponent)
        e.install(LightComponent, { type: LightType.Directional })
        e.get(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
      },
    )
    .createChild(
      (e) => {
        e.name = 'Ground'
        e.install(ModelComponent)
        e.addComponent(new PhysicsProxy(0, 100))
        e.get(PhysicsProxy).resetPosition(0, -50, 0)
      },
    )
    .createChild((e) => {
      e.name = 'Cubes'
      const boxCount = 100
      for (let i = 0; i < boxCount; i++) {
        e.createChild((e) => {
          e.name = `Cube ${i}`
          e.install(ModelComponent)
          e.addComponent(new PhysicsProxy(1, 2))
          e.addComponent(new CubeComponent())
        })
      }
    })

  }

  public onInit() {
    const step = this.renderer.scene.steps[0] as BasicRenderStep
    step.clearColor = Color.CornflowerBlue.rgba

    this.renderer.scene.camera = this.camera
    setTimeout(() => this.resetCubes())
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.view.viewport.aspect

    if (this.keyboard.justReleased(KeyboardKey.Space)) {
      this.resetCubes()
    }
  }

  public resetCubes() {
    const cubes: Entity[] = []
    this.entity.root.findAll('/Cubes/*', cubes)
    const side = Math.ceil(Math.pow(cubes.length, 1 / 3))

    let i = 0
    for (let y = 0; y < side; y++) {
      for (let z = 0; z < side; z++) {
        for (let x = 0; x < side; x++) {
          if (i >= cubes.length) {
            return
          }
          cubes[i++].get(PhysicsProxy).resetPosition(
            (x - side / 2 + 0.5) * (2.2 + Math.random()),
            25 + y * (3 + Math.random()),
            (z - side / 2 + 0.5) * (2.2 + Math.random()),
          )
        }
      }
    }
  }
}

@Component()
class PhysicsWorld implements OnDestroy, OnUpdate {
  public readonly name = 'PhysicsWorld'

  public readonly config = new Ammo.btDefaultCollisionConfiguration()
  public readonly dispatcher = new Ammo.btCollisionDispatcher(this.config)
  public readonly pairCache = new Ammo.btDbvtBroadphase()
  public readonly solver = new Ammo.btSequentialImpulseConstraintSolver()
  public readonly world = new Ammo.btDiscreteDynamicsWorld(
    this.dispatcher,
    this.pairCache as any,
    this.solver,
    this.config,
  )

  public onUpdate(dt: number) {
    this.world.stepSimulation(dt)
  }

  public onDestroy() {
    Ammo.destroy(this.world)
    Ammo.destroy(this.solver)
    Ammo.destroy(this.pairCache)
    Ammo.destroy(this.dispatcher)
    Ammo.destroy(this.config)
  }
}

@Component({
  install: [TransformComponent]
})
class PhysicsProxy implements OnUpdate {
  public readonly name = 'Physics'

  @Inject(PhysicsWorld, { from: 'root' })
  public physics: PhysicsWorld

  @Inject(TransformComponent)
  public transform: TransformComponent

  private shape: Ammo.btBoxShape
  private body: Ammo.btRigidBody
  private reset = Vec3.create()
  private needsReset = false

  public constructor(private mass: number, private size: number) {

  }

  public onInit() {
    this.initBoxShape(this.mass, this.size)
  }

  public initBoxShape(mass: number, size: number) {
    if (this.body) {
      this.physics.world.removeRigidBody(this.body)
      Ammo.destroy(this.body)
      Ammo.destroy(this.shape)
      this.body = null
      this.shape = null
    }

    const shape = new Ammo.btBoxShape(new Ammo.btVector3(size / 2, size / 2, size / 2))
    const isDynamic = !!mass
    const localInertia = new Ammo.btVector3(0, 0, 0)

    if (isDynamic) {
      shape.calculateLocalInertia(mass, localInertia)
    }

    const motionState = new Ammo.btDefaultMotionState()
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia)
    const body = new Ammo.btRigidBody(rbInfo)

    this.shape = shape
    this.body = body
    this.physics.world.addRigidBody(this.body)
  }

  public onUpdate() {
    if (this.body && this.needsReset) {
      const origin = this.body.getWorldTransform().getOrigin()
      origin.setX(this.reset.x)
      origin.setY(this.reset.y)
      origin.setZ(this.reset.z)
      const rotation = this.body.getWorldTransform().getRotation()
      rotation.setX(1)
      rotation.setY(0)
      rotation.setZ(0)
      rotation.setW(1)
      this.body.activate()
      this.needsReset = false
    }

    if (this.body && this.transform) {
      const t = this.body.getWorldTransform()
      const o = t.getOrigin()
      const r = t.getRotation()
      this.transform.rotation.init(r.x(), r.y(), r.z(), r.w())
      this.transform.position.init(o.x(), o.y(), o.z())
      this.transform.dirty = true
    }
  }

  public resetPosition(x: number, y: number, z: number) {
    this.reset.init(x, y, z)
    this.needsReset = true
  }
}

@Component({
  install: [ModelComponent]
})
class CubeComponent implements OnInit {

  public name = 'Cube'

  @Inject(ModelComponent)
  public renderable: ModelComponent

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  public async onInit() {
    this.renderable.model = await this.content.load('/assets/models/obj/cube.obj', Model)
  }
}

Ammo(Ammo).then(() => {
  createGame({
    device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
    autorun: true,
  }).install(MyGame)
})

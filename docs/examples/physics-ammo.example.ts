import {
  BehaviorComponent,
  CameraComponent,
  EcsGame,
  KeyboardInputSystem,
  LightComponent,
  ModelComponent,
  MouseInputSystem,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'

import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, GameSystem } from '@gglib/ecs'
import { KeyboardKeys } from '@gglib/game'
import { BasicMaterial, Color, CommonInputs, Device, PlatformId, TRUE } from '@gglib/graphics'
import { MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, Vec3 } from '@gglib/math'
import Ammo from 'ammojs-typed'
import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  let game: Game
  Ammo.bind(Ammo)(Ammo).then(() => {
    game = new Game({ canvas, platform, autosize: true })
    game.run()

    mountUi(tools, (ui) => {
      ui.bool(game.loop, 'useFixedTimeStep', {
        label: 'Fixed Time Step',
      })
      ui.button('Reset Cubes', {
        onclick: () => game?.resetCubes(),
      })
    })
  })

  return () => {
    game?.stop()
  }
}

class Game extends EcsGame {
  private cubes: GameEntity[] = []
  private keyboard!: KeyboardInputSystem
  private mouse!: MouseInputSystem

  public override onCreate(): void {
    this.world.addSystem(new KeyboardInputSystem({}))
    this.world.addSystem(new MouseInputSystem({}))
    this.world.addSystem(new PhysicsWorld())

    this.keyboard = this.world.getSystem(KeyboardInputSystem)
    this.mouse = this.world.getSystem(MouseInputSystem)
  }

  public override onInitialize(): void {
    this.loop.useFixedTimeStep = false

    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerMaterial(BasicMaterial, () => true)
    this.renderer.onContextReady.add((ctx) => {
      ctx.renderInputs.set(CommonInputs.Global.SkyColor, Color.White)
      ctx.renderInputs.set(CommonInputs.Global.GroundColor, Color.Black)
    })
    this.createCamera()
    this.createLight()
    this.createObjects()
    this.resetCubes()
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene,
      transform: new TransformComponent({
        position: Vec3.create(0, 10, 25),
      }),
      components: [
        new CameraComponent({
          type: 'perspective',
        }),
        new WASDComponent(),
      ],
    })
    this.view.camera = entity.component(CameraComponent)
  }

  private createLight() {
    const entity = this.createEntity({
      name: 'light',
      parent: this.scene,
      transform: new TransformComponent({}),
      components: [new LightComponent()],
    })
    entity.getTransform<TransformComponent>()!.setRotationAxisAngle(1, 0, 0, -1)
  }

  public createObjects() {
    const ground = this.createEntity({
      name: 'Ground',
      parent: this.scene,
      transform: new TransformComponent({
        scale: Vec3.create(50, 50, 50),
      }),
      components: [new ModelComponent(), new PhysicsProxy(0, 100), new CubeComponent()],
    })
    ground.component(PhysicsProxy).resetPosition(0, -50, 0)

    const boxCount = 100
    for (let i = 0; i < boxCount; i++) {
      const cube = this.createEntity({
        name: `Cube ${i}`,
        parent: this.scene,
        transform: new TransformComponent({}),
        components: [new ModelComponent(), new PhysicsProxy(1, 2), new CubeComponent()],
      })
      this.cubes.push(cube)
    }
  }

  public override onUpdate(time: number, dt: number) {
    this.view.camera.projection.initPerspectiveFieldOfView(
      70 * DEGREE_TO_RAD,
      this.world.getSystem(Device).output.aspectRatio,
      0.01,
      100,
      this.device.ndcMinZ,
    )
    if (this.keyboard.justReleased(KeyboardKeys.Space)) {
      this.resetCubes()
    }
  }

  public resetCubes() {
    const cubes = this.cubes
    const side = Math.ceil(Math.pow(cubes.length, 1 / 3))

    let i = 0
    for (let y = 0; y < side; y++) {
      for (let z = 0; z < side; z++) {
        for (let x = 0; x < side; x++) {
          if (i >= cubes.length) {
            return
          }
          cubes[i++]
            .component(PhysicsProxy)!
            .resetPosition(
              (x - side / 2 + 0.5) * (2.2 + Math.random()),
              25 + y * (3 + Math.random()),
              (z - side / 2 + 0.5) * (2.2 + Math.random()),
            )
        }
      }
    }
  }
}

class PhysicsWorld extends GameSystem {
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

  public initialize(): void {
    //
  }

  public destroy(): void {
    Ammo.destroy(this.world)
    Ammo.destroy(this.solver)
    Ammo.destroy(this.pairCache)
    Ammo.destroy(this.dispatcher)
    Ammo.destroy(this.config)
  }

  public update(time: number, dt: number) {
    this.world.stepSimulation(dt)
  }
}

class PhysicsProxy implements GameComponent, BehaviorComponent {
  public physics!: PhysicsWorld

  public get transform() {
    return this.entity.getTransform<TransformComponent>()
  }

  private shape!: Ammo.btBoxShape
  private body!: Ammo.btRigidBody
  private reset = Vec3.create()
  private needsReset = false

  public constructor(
    private mass: number,
    private size: number,
  ) {
    //
  }

  public readonly entity!: GameEntity
  public initialize(): void {
    this.physics = this.entity.service(PhysicsWorld)

    this.initBoxShape(this.mass, this.size)
  }

  public destroy(): void {
    //
  }

  public initBoxShape(mass: number, size: number) {
    if (this.body) {
      this.physics.world.removeRigidBody(this.body)
      Ammo.destroy(this.body)
      Ammo.destroy(this.shape)
      this.body = null!
      this.shape = null!
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

  public updateBehavior() {
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
      this.transform.translation.init(o.x(), o.y(), o.z())
      this.transform.markAsChanged()
    }
  }

  public resetPosition(x: number, y: number, z: number) {
    this.reset.init(x, y, z)
    this.needsReset = true
  }
}

const protoNames = ['dark', 'green', 'light', 'orange', 'purple', 'red']
class CubeComponent implements GameComponent {
  public renderable!: ModelComponent
  public entity!: GameEntity

  public async initialize() {
    this.renderable = this.entity.component(ModelComponent)
    const content = this.entity.service(ContentLoader)

    const protoName = protoNames[Math.floor(Math.random() * protoNames.length)]
    const texture = await content.loadTexture(`/textures/prototype/${protoName}/texture_01.png`)
    const model = await content.loadModel('/models/obj/cube1.obj')
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as BasicMaterial
        mtl.BaseMap = texture
        mtl.UseBaseMap = TRUE
      }
    }
    this.renderable.model = model
  }

  public destroy(): void {
    this.renderable.model?.dispose()
    this.renderable.model = null!
  }
}

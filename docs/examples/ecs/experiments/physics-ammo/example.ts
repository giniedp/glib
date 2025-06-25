import {
  BasicGame,
  createEntity,
  KeyboardInput,
  LightComponent,
  LoopTime,
  ModelComponent,
  MouseInput,
  PerspectiveCameraComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { GameComponent, GameEntity, GameProvider, GameSystem } from '@gglib/ecs'
import { GameTransform } from '@gglib/ecs/dist/ecs/src/GameTransform'
import { BlendState, Color, DepthState, Device } from '@gglib/graphics'
import { KeyboardKey } from '@gglib/input'
import { MTL, OBJ } from '@gglib/loaders'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Vec3 } from '@gglib/math'
import { BasicRenderPass } from '@gglib/render'
import Ammo from 'ammojs-typed'
import * as TweakUi from 'tweak-ui'
export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  let game: Game
  Ammo.bind(Ammo)(Ammo).then(() => {
    game = new Game(canvas)
    game.run()

    TweakUi.mount(tools, (ui) => {
      ui.checkbox(game.loop, 'useFixedTimeStep', {
        label: 'Fixed Time Step',
      })
      ui.button('Reset Cubes', {
        onClick: () => game?.resetCubes(),
      })
    })
  })

  return () => {
    game?.stop()
  }
}

class Game extends BasicGame {
  private cubes: GameEntity<TransformComponent>[] = []
  public constructor(canvas: HTMLCanvasElement) {
    super(canvas)

    this.addSystem(
      new KeyboardInput({
        //
      }),
    )
    this.addSystem(
      new MouseInput({
        preventDefault: true,
      }),
    )
    this.addSystem(new PhysicsWorld())
    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)
    this.content.registerMaterial({
      name: 'BasicEffect',
      type: AutoMaterial,
    })
    this.renderer.steps = [
      new BasicRenderPass({
        blendState: BlendState.Default,
        depthState: DepthState.Default,
        clearColor: Color.CornflowerBlue.rgba,
      }),
    ]
    this.loop.useFixedTimeStep = false
    this.createCamera()
    this.createLight()
    this.createObjects()
    this.resetCubes()
  }

  private createCamera() {
    const entity = createEntity({
      name: 'camera',
      components: [
        new PerspectiveCameraComponent({
          near: 0.01,
          far: 1000,
          fov: 70 * DEGREE_TO_RAD,
          aspect: 16 / 9,
        }),
        new WASDComponent(),
      ],
      transform: {
        position: Vec3.create(0, 10, 25),
      },
    })
    this.camera = entity.component(PerspectiveCameraComponent)
    this.scene.add(entity)
  }

  private createLight() {
    const entity = createEntity({
      name: 'light',
      components: [new LightComponent()],
    })
    entity.transform.setRotationAxisAngle(1, 0, 0, -1)
    this.scene.add(entity)
  }

  public createObjects() {
    const ground = createEntity({
      name: 'Ground',
      transform: {
        scale: Vec3.create(50, 50, 50),
      },
      components: [new ModelComponent(), new PhysicsProxy(0, 100), new CubeComponent()],
    })
    ground.component(PhysicsProxy).resetPosition(0, -50, 0)
    this.scene.add(ground)

    const boxCount = 100
    for (let i = 0; i < boxCount; i++) {
      const cube = createEntity({
        name: `Cube ${i}`,
        components: [new ModelComponent(), new PhysicsProxy(1, 2), new CubeComponent()],
      })
      this.scene.add(cube)
      this.cubes.push(cube)
    }
  }

  public override update() {
    this.camera.projection.initPerspectiveFieldOfView(
      70 * DEGREE_TO_RAD,
      this.get(Device).drawingBufferAspectRatio,
      0.01,
      1000,
    )
    if (this.get(KeyboardInput).justReleased(KeyboardKey.Space)) {
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
            .component(PhysicsProxy)
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

class PhysicsWorld implements GameSystem {
  public game: Game
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

  public initialize(container: GameProvider): void {
    this.game = container.get(Game)
    this.game.loop.onUpdate.add(this.update)
  }

  public destroy(): void {
    this.game.loop.onUpdate.remove(this.update)
    Ammo.destroy(this.world)
    Ammo.destroy(this.solver)
    Ammo.destroy(this.pairCache)
    Ammo.destroy(this.dispatcher)
    Ammo.destroy(this.config)
  }

  public update = (time: LoopTime) => {
    this.world.stepSimulation(time.deltaMs)
  }
}

class PhysicsProxy implements GameComponent {
  public physics: PhysicsWorld
  public game: Game

  public get transform() {
    return this.entity.transform
  }

  private shape: Ammo.btBoxShape
  private body: Ammo.btRigidBody
  private reset = Vec3.create()
  private needsReset = false

  public constructor(private mass: number, private size: number) {
    //
  }

  public entity: GameEntity<TransformComponent>
  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.physics = this.entity.provider.get(PhysicsWorld)
    this.game = this.entity.provider.get(Game)
    this.initBoxShape(this.mass, this.size)
  }

  public activate(): void {
    this.game.loop.onUpdate.add(this.update)
  }

  public deactivate(): void {
    this.game.loop.onUpdate.remove(this.update)
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

  public update = (time: LoopTime) => {
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
      this.transform.needsUpdate = true
    }
  }

  public resetPosition(x: number, y: number, z: number) {
    this.reset.init(x, y, z)
    this.needsReset = true
  }
}

const protoNames = ['dark', 'green', 'light', 'orange', 'purple', 'red']
class CubeComponent implements GameComponent {
  public renderable: ModelComponent
  public entity: GameEntity<GameTransform>

  public async initialize(entity: GameEntity<GameTransform>) {
    this.entity = entity
    this.renderable = entity.component(ModelComponent)
    const content = entity.provider.get(ContentLoader)

    const protoName = protoNames[Math.floor(Math.random() * protoNames.length)]
    const texture = await content.loadTexture(`/textures/prototype/${protoName}/texture_01.png`)
    const model = await content.loadModel('/models/obj/cube1.obj')
    for (const mesh of model.meshes) {
      for (const material of mesh.materials) {
        const mtl = material as AutoMaterial
        mtl.BaseColorMap = texture
        mtl.BaseColor = [1, 1, 1, 1]
        mtl.LightCount = 1
        mtl.ShadeFunction = 'shadePbr'
      }
    }
    this.renderable.model = model
  }

  public activate(): void {
    //
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    this.renderable.model?.dispose()
    this.renderable.model = null!
  }
}

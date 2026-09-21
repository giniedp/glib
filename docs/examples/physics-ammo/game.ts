import {
  CameraComponent,
  EcsGame,
  KeyboardInputSystem,
  LightComponent,
  ModelComponent,
  MouseInputSystem,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'

import { GameEntity } from '@gglib/ecs'
import { KeyboardKeys } from '@gglib/game'
import { BasicMaterial, Color, CommonInputs, Device, PlatformId } from '@gglib/graphics'
import { MTL, OBJ } from '@gglib/loaders'
import { DEGREE_TO_RAD, vec3, Vec3, vec4 } from '@gglib/math'
import { Renderer } from '@gglib/render'
import Ammo from 'ammojs-typed'
import { mountUi } from 'tweak-ui'
import { GameComponent } from './game-object'
import { PhysicsProxy, PhysicsShape } from './physics-proxy'
import { PhysicsWorld } from './physics-world'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  let game: Game
  Ammo.bind(Ammo)(Ammo).then(() => {
    game = new Game({ canvas, platform, autosize: true })
    game.run()

    mountUi(tools, (ui) => {
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
    this.content.registerLoader(OBJ.Loader)
    this.content.registerLoader(MTL.Loader)

    const renderer = this.world.getSystem(Renderer)
    renderer.linearToSrgb = true
    renderer.inputs.set(CommonInputs.Global.AmbientColor, Color.Black)
    renderer.inputs.set(CommonInputs.Global.AmbientColorTop, Color.White)
    renderer.inputs.set(CommonInputs.Global.AmbientDirection, Vec3.normalize(vec3(1, 1, 1)))

    this.createCamera()
    this.createLight()
    this.createObjects()
    this.resetCubes()
  }

  private createCamera() {
    const entity = this.createEntity({
      name: 'camera',
      parent: this.scene.entity,
      transform: new TransformComponent({
        position: vec3(0, 10, 25),
      }),
      components: [
        new CameraComponent({
          type: 'perspective',
        }),
        new WASDComponent(),
      ],
    })
    this.scene.setCamera(0, entity.component(CameraComponent))
  }

  private createLight() {
    const entity = this.createEntity({
      name: 'light',
      parent: this.scene.entity,
      transform: new TransformComponent({}),
      components: [new LightComponent()],
    })
    entity.getTransform<TransformComponent>()!.setRotationAxisAngle(1, 0, 0, -1)
  }

  public createObjects() {
    this.createEntity({
      name: 'Ground',
      parent: this.scene.entity,
      transform: new TransformComponent(),
      components: [
        new ModelComponent(),
        new GameComponent(),
        new PhysicsProxy({
          mass: 0,
          size: vec3(100, 1, 100),
          dynamic: false,
          shape: PhysicsShape.Box,
        }),
      ],
    })

    this.createEntity({
      name: 'Wall',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(0, 1, -50) }),
      components: [
        new ModelComponent(),
        new GameComponent(),
        new PhysicsProxy({
          mass: 0,
          size: vec3(100, 2, 2),
          dynamic: false,
          shape: PhysicsShape.Box,
        }),
      ],
    })

    this.createEntity({
      name: 'Wall',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(0, 1, 50) }),
      components: [
        new ModelComponent(),
        new GameComponent(),
        new PhysicsProxy({
          mass: 0,
          size: vec3(100, 2, 2),
          dynamic: false,
          shape: PhysicsShape.Box,
        }),
      ],
    })

    this.createEntity({
      name: 'Wall',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(-50, 1, 0) }),
      components: [
        new ModelComponent(),
        new GameComponent(),
        new PhysicsProxy({
          mass: 0,
          size: vec3(2, 2, 100),
          dynamic: false,
          shape: PhysicsShape.Box,
        }),
      ],
    })
    this.createEntity({
      name: 'Wall',
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(50, 1, 0) }),
      components: [
        new ModelComponent(),
        new GameComponent(),
        new PhysicsProxy({
          mass: 0,
          size: vec3(2, 2, 100),
          dynamic: false,
          shape: PhysicsShape.Box,
        }),
      ],
    })
    const boxCount = 100
    for (let i = 0; i < boxCount; i++) {
      const cube = this.createEntity({
        name: `Cube ${i}`,
        parent: this.scene.entity,
        transform: new TransformComponent({}),
        components: [
          new ModelComponent(),
          new GameComponent(),
          new PhysicsProxy({
            mass: 1,
            size: vec3(1),
            dynamic: true,
            shape: PhysicsShape.Sphere,
          }),
        ],
      })
      this.cubes.push(cube)
    }
    this.resetCubes()
  }

  public override onUpdate(time: number, dt: number) {
    this.scene
      .getView(0)
      .camera.projection.initPerspectiveFieldOfView(
        70 * DEGREE_TO_RAD,
        this.world.getSystem(Device).output.aspectRatio,
        0.01,
        100,
        this.device.ndcMinZ,
      )
    if (this.keyboard.justPressed(KeyboardKeys.Enter)) {
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
            .setTransform(
              vec3(
                (x - side / 2 + 0.5) * (2.2 + Math.random()),
                25 + y * (3 + Math.random()),
                (z - side / 2 + 0.5) * (2.2 + Math.random()),
              ),
              vec4(0, 0, 0, 1),
            )
        }
      }
    }
  }
}

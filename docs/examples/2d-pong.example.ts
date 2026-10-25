import {
  BehaviorComponent,
  boxCollider,
  CameraComponent,
  ColliderComponent,
  CollisionSystem,
  EcsGame,
  GamePadInput,
  KeyboardInputSystem,
  SpriteComponent,
  TransformComponent,
} from '@gglib/components'
import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { GamepadAxes, KeyboardKeys } from '@gglib/game'
import { PlatformId } from '@gglib/graphics'
import { clamp, vec3 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new PongGame({ canvas, platform, autosize: true })
  game.run()
  return () => game.destroy()
}

// the size of the field in world units, the origin is at the bottom left
const WIDTH = 63
const HEIGHT = 27

class PongGame extends EcsGame {
  private camera!: CameraComponent

  protected override onCreate(): void {
    this.world.addSystem(new KeyboardInputSystem())
    this.world.addSystem(new GamePadInput())
    this.world.addSystem(new CollisionSystem())
  }

  protected override onInitialize(): void {
    this.camera = this.createEntity({
      parent: this.scene.entity,
      transform: new TransformComponent({
        position: vec3(WIDTH / 2, HEIGHT / 2, 1),
      }),
      components: [
        new CameraComponent({
          type: 'orthographic',
          near: 0.1,
          far: 10,
        }),
      ],
    }).$(CameraComponent)
    this.scene.setCamera(0, this.camera)

    // a dark background behind the field, the renderer clears to transparent
    this.createEntity({
      parent: this.scene.entity,
      transform: new TransformComponent({
        position: vec3(WIDTH / 2, HEIGHT / 2, -1),
      }),
      components: [
        new SpriteComponent({
          width: 1000,
          height: 1000,
        }).setColor(0, 0, 0),
      ],
    })
    this.createBox(WIDTH / 2, -0.5, WIDTH, 1)
    this.createBox(WIDTH / 2, HEIGHT + 0.5, WIDTH, 1)
    this.createBox(WIDTH / 2, HEIGHT / 2, 1, 1, new BallComponent())
    this.createBox(
      1.5,
      HEIGHT / 2,
      1,
      5,
      new PaddleComponent({
        up: KeyboardKeys.KeyW,
        down: KeyboardKeys.KeyS,
        pad: 0,
      }),
    )
    this.createBox(
      WIDTH - 1.5,
      HEIGHT / 2,
      1,
      5,
      new PaddleComponent({
        up: KeyboardKeys.KeyI,
        down: KeyboardKeys.KeyK,
        pad: 1,
      }),
    )
  }

  /**
   * Creates a white box that collides. Without a texture a sprite is a white quad
   */
  private createBox(x: number, y: number, width: number, height: number, ...components: GameComponent[]) {
    return this.createEntity({
      parent: this.scene.entity,
      transform: new TransformComponent({ position: vec3(x, y, 0) }),
      components: [new SpriteComponent({ width, height }), boxCollider(vec3(width, height, 1)), ...components],
    })
  }

  protected override onUpdate(): void {
    // fit the field into the view
    this.camera.aspect = this.device.output.aspectRatio
    this.camera.orthographicScale = Math.max(WIDTH + 2, (HEIGHT + 2) * this.camera.aspect)
  }
}

/**
 * Moves the paddle with keyboard and gamepad and flashes it when the ball hits it
 */
class PaddleComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public readonly entity!: GameEntity
  public speed = 20
  private keyboard!: KeyboardInputSystem
  private pads!: GamePadInput
  private transform!: TransformComponent
  private sprite!: SpriteComponent
  private sinceHit = 1

  public constructor(private input: { up: string; down: string; pad: number }) {}

  public initialize(): void {
    this.keyboard = this.entity.service(KeyboardInputSystem)
    this.pads = this.entity.service(GamePadInput)
    this.transform = this.entity.component(TransformComponent)
    this.sprite = this.entity.component(SpriteComponent)
    this.entity.events.on(ColliderComponent.onCollisionEnter, ({ other }) => {
      if (other.entity.has(BallComponent)) {
        this.sinceHit = 0
      }
    })
  }

  public updateBehavior(time: number, dt: number): void {
    let direction = 0
    if (this.keyboard.isPressed(this.input.up)) {
      direction += 1
    }
    if (this.keyboard.isPressed(this.input.down)) {
      direction -= 1
    }
    const axis = this.pads.axesValue(this.input.pad, GamepadAxes.LeftVertical)
    if (Math.abs(axis) > 0.1) {
      direction -= Math.sign(axis)
    }

    const half = this.sprite.height / 2
    const y = this.transform.translation.y + direction * this.speed * dt
    this.transform.setPositionY(clamp(y, half, HEIGHT - half))

    this.sinceHit += dt
    const t = Math.min(1, this.sinceHit)
    this.sprite.setColor(1, t, t)
  }
}

/**
 * Moves the ball, bounces it off paddles and walls and serves again when it leaves the field
 */
class BallComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public readonly entity!: GameEntity
  public speed = 40
  private transform!: TransformComponent
  private dx = 0
  private dy = 0

  public initialize(): void {
    this.transform = this.entity.component(TransformComponent)
    this.entity.events.on(ColliderComponent.onCollisionEnter, ({ other }) => this.bounce(other.entity))
    this.serve()
  }

  public updateBehavior(time: number, dt: number): void {
    const x = this.transform.translation.x
    const y = this.transform.translation.y
    if (x < -1 || x > WIDTH + 1) {
      this.serve()
    } else {
      this.transform.setPosition(x + this.dx * this.speed * dt, y + this.dy * this.speed * dt, 0)
    }
  }

  private serve() {
    this.dx = Math.random() > 0.5 ? 1 : -1
    this.dy = 0
    this.transform.setPosition(WIDTH / 2, HEIGHT / 2, 0)
  }

  private bounce(other: GameEntity) {
    const ball = this.transform.translation
    const box = other.component(TransformComponent).translation
    if (other.has(PaddleComponent)) {
      // the further from the paddle center, the steeper the ball leaves
      const paddle = other.component(SpriteComponent)
      this.dx = Math.sign(ball.x - box.x)
      this.dy = (ball.y - box.y) / paddle.height
      // move the ball out of the paddle, so it does not hit again
      this.transform.setPositionX(box.x + this.dx * (paddle.width / 2 + 0.5))
    } else {
      // a wall
      this.dy = Math.sign(ball.y - box.y) * Math.abs(this.dy)
    }
  }
}

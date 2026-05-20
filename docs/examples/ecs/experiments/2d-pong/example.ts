import {
  BasicGame,
  BehaviorComponent,
  GamePadInput,
  KeyboardInputSystem,
  SpriteComponent,
  TransformComponent,
} from '@gglib/components'

import { GameComponent, GameEntity, InitializableComponent } from '@gglib/ecs'
import { Color, PlatformId, Texture } from '@gglib/graphics'
import { GamepadAxes, KeyboardKey } from '@gglib/input'
import { Mat4, Vec4 } from '@gglib/math'
import { BloomPass, LayerMask, PixelatePass } from '@gglib/render'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new PongGame({ canvas, platform })
  game.run()
  return () => {
    game.stop()
  }
}

class PongGame extends BasicGame {
  public width = 63
  public height = 27

  public state: 'started' | 'reset' | 'running' | 'scored' = 'started'
  public whitePixel!: Texture
  public scoreLeft = 0
  public scoreRight = 0

  private paddle1!: PaddleComponent
  private paddle2!: PaddleComponent
  private ball!: BallComponent
  private pixelate!: PixelatePass
  private bloom!: BloomPass

  override initialize(): void {
    this.world.addSystem(new KeyboardInputSystem({}))
    this.world.addSystem(new GamePadInput())

    this.whitePixel = this.renderer.device.createTexture({
      source: [0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff],
      width: 1,
      height: 1,
    })
    this.view.camera = {
      visibilityMask: LayerMask.All,
      projection: Mat4.createIdentity(),
      view: Mat4.createIdentity(),
      world: Mat4.createIdentity(),
      reversedZ: false,
    }
    this.pixelate = new PixelatePass(this.device, { enabled: true })
    this.bloom = new BloomPass(this.device, { enabled: true })
    this.renderer.pipeline.addPass(this.pixelate)
    this.renderer.pipeline.addPass(this.bloom)
    this.createObjects()
    this.world.initilize()
    this.scene.activate()
  }

  public override update(t: number, dt: number) {
    super.update(t, dt)
    this.pixelate.enabled = true
    this.pixelate.size = this.device.output.width / this.width / 4
    this.pixelate.aspect = 1
    this.pixelate.corner = 1
    this.pixelate.gap = 8 / this.width
    this.bloom.enabled = true
    this.bloom.glowCut = 0.9

    this.view.camera.projection.initOrthographicOffCenter(0, this.width, 0, this.height, 0, 1, this.device.ndcMinZ)
    switch (this.state) {
      case 'started':
        this.state = 'reset'
        break
      case 'scored':
        this.state = 'reset'
        break
      case 'reset':
        this.state = 'running'
        break
      case 'running':
        //
        break
      default:
        this.state = 'started'
        break
    }
    this.updateLogic(t, dt)
  }

  public onScoreLeft() {
    this.scoreLeft++
    this.state = 'scored'
  }

  public onScoreRight() {
    this.scoreRight++
    this.state = 'scored'
  }

  private createObjects() {
    const paddle1 = this.createEntity({
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new SpriteComponent(), new PaddleComponent({ isLeft: true })],
    })
    this.paddle1 = paddle1.component(PaddleComponent)

    const paddle2 = this.createEntity({
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new SpriteComponent(), new PaddleComponent({ isLeft: false })],
    })
    this.paddle2 = paddle2.component(PaddleComponent)

    const ball = this.createEntity({
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new SpriteComponent(), new BallComponent()],
    })
    this.ball = ball.component(BallComponent)
  }

  private updateLogic(time: number, dt: number) {
    if (this.state !== 'running') {
      return
    }

    if (this.ball.x + this.ball.w < 0) {
      this.onScoreRight()
    }
    if (this.ball.x > this.width) {
      this.onScoreLeft()
    }
    if (this.paddle1.intersects(this.ball.x, this.ball.y, this.ball.w, this.ball.w)) {
      this.ball.x = this.paddle1.x + this.paddle1.w
      this.ball.dy = -(this.paddle1.cy - this.ball.cy) / this.paddle1.h
      this.ball.dx = 1
      this.paddle1.touchedAt = time
      this.ball.touchedAt = time
    }
    if (this.paddle2.intersects(this.ball.x, this.ball.y, this.ball.w, this.ball.w)) {
      this.ball.x = this.paddle2.x - this.ball.w
      this.ball.dy = -(this.paddle2.cy - this.ball.cy) / this.paddle1.h
      this.ball.dx = -1
      this.paddle2.touchedAt = time
      this.ball.touchedAt = time
    }
    if (this.ball.y + this.ball.h > this.height) {
      this.ball.y = this.height - this.ball.h
      this.ball.dy = -Math.abs(this.ball.dy)
    }
    if (this.ball.y < 0) {
      this.ball.y = 0
      this.ball.dy = Math.abs(this.ball.dy)
    }
  }
}

class PaddleComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public name = 'Paddle'

  public game!: PongGame
  public entity!: GameEntity
  public transform!: TransformComponent
  public sprite!: SpriteComponent
  public keyboard!: KeyboardInputSystem
  public pads!: GamePadInput
  public touchedAt = 0

  public x = 0
  public y = 0
  public w = 1
  public h = 5
  public speed = 20
  private isLeft!: boolean
  private color: Vec4 = Vec4.create(1, 1, 1, 1)

  public get cy() {
    return this.y - this.h / 2
  }

  public constructor(options: { isLeft: boolean }) {
    this.isLeft = options?.isLeft ?? this.isLeft
  }

  public initialize(): void {
    this.game = this.entity.service(PongGame)
    this.transform = this.entity.component(TransformComponent)
    this.keyboard = this.entity.service(KeyboardInputSystem)
    this.pads = this.entity.service(GamePadInput)
    this.sprite = this.entity.component(SpriteComponent)
    this.sprite.setTexture(this.game.whitePixel)
    this.sprite.setSource(0, 0, this.game.whitePixel.width, this.game.whitePixel.height)
    this.sprite.setPivot(0, 0)
    this.sprite.setSize(this.w, this.h)
    this.sprite.setColor(this.color)
  }

  public updateBehavior(time: number, dt: number): void {
    if (this.game.state === 'reset') {
      this.y = (this.game.height + this.h) / 2
      this.x = this.isLeft ? 1 : this.game.width - 1 - this.w
    }

    if (this.game.state === 'running') {
      const upKey = this.isLeft ? KeyboardKey.KeyW : KeyboardKey.KeyI
      const downKey = this.isLeft ? KeyboardKey.KeyS : KeyboardKey.KeyK
      const player = this.isLeft ? 0 : 1

      let direction = 0
      if (this.keyboard.isPressed(upKey)) {
        direction += 1
      }
      if (this.keyboard.isPressed(downKey)) {
        direction -= 1
      }
      let axisValue = this.pads.axisValue(player, GamepadAxes.LeftVertical)
      if (Math.abs(axisValue) < 0.1) {
        axisValue = 0
      }

      direction += -Math.sign(axisValue)
      this.y += direction * this.speed * (dt / 1000)
      this.y = Math.min(Math.max(0, this.y), this.game.height - this.h)
    }

    this.transform.setPosition(this.x, this.y, 0)
    const t = Math.min(1, (time - this.touchedAt) / 1000)
    this.color.x = 1
    this.color.y = t
    this.color.z = t
    this.sprite.setColor(this.color)
  }

  public intersects(x: number, y: number, w: number, h: number) {
    if (this.x > x + w) {
      return false
    }
    if (x > this.x + this.w) {
      return false
    }
    if (this.y < y - h) {
      return false
    }
    if (y < this.y - this.h) {
      return false
    }
    return true
  }
}

class BallComponent implements GameComponent, InitializableComponent, BehaviorComponent {
  public game!: PongGame
  public sprite!: SpriteComponent
  public entity!: GameEntity
  public transform!: TransformComponent

  public x = 0
  public y = 0
  public w = 1
  public h = 1
  public dx = 0
  public dy = 0
  public speed = 40
  public touchedAt = 0

  public get cy() {
    return this.y - this.h / 2
  }

  public initialize(): void {
    this.game = this.entity.service(PongGame)
    this.transform = this.entity.component(TransformComponent)
    this.sprite = this.entity.component(SpriteComponent)
    this.sprite.setTexture(this.game.whitePixel)
    this.sprite.setSource(0, 0, this.game.whitePixel.width, this.game.whitePixel.height)
    this.sprite.setSize(1, 1)
    this.sprite.setColor(Color.White)
  }

  public updateBehavior(t: number, dt: number) {
    if (this.game.state === 'reset') {
      this.dx = Math.random() > 0.5 ? 1 : -1
      this.dy = 0
      this.x = this.game.width / 2
      this.y = (this.game.height + this.h) / 2
    }

    if (this.game.state === 'running') {
      this.x += (this.dx * this.speed * dt) / 1000
      this.y += (this.dy * this.speed * dt) / 1000
    }

    this.transform.setPosition(this.x, this.y, 0)
  }
}

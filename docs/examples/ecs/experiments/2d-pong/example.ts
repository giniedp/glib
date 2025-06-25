import { BasicGame, createEntity, LoopTime, SpriteComponent, TransformComponent } from '@gglib/components'
import { GameComponent, GameEntity } from '@gglib/ecs'
import { Color, Texture } from '@gglib/graphics'
import { Keyboard, KeyboardKey } from '@gglib/input'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new PongGame(canvas)
  game.run()
  return () => {
    game.stop()
  }
}

class PongGame extends BasicGame {
  public width = 63
  public height = 27

  public state: 'started' | 'reset' | 'running' | 'scored' = 'started'
  public whitePixel: Texture
  public scoreLeft = 0
  public scoreRight = 0

  private paddle1: PaddleComponent
  private paddle2: PaddleComponent
  private ball: BallComponent

  public constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.camera.projection.initOrthographicOffCenter(0, this.width, 0, this.height, 0, 100)

    // All components will render this white pixel texture as a sprite
    this.whitePixel = this.renderer.device.createTexture({
      source: [0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff],
      width: 1,
      height: 1,
    })
    this.provide(new Keyboard({}))
    this.createObjects()
  }

  public override update() {
    this.get(Keyboard).update()
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
    this.updateLogic()
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
    const paddle1 = createEntity({
      components: [new SpriteComponent(), new PaddleComponent({ isLeft: true })],
    })
    this.paddle1 = paddle1.component(PaddleComponent)
    this.scene.add(paddle1)

    const paddle2 = createEntity({
      components: [new SpriteComponent(), new PaddleComponent({ isLeft: false })],
    })
    this.paddle2 = paddle2.component(PaddleComponent)
    this.scene.add(paddle2)

    const ball = createEntity({
      components: [new SpriteComponent(), new BallComponent()],
    })
    this.ball = ball.component(BallComponent)
    this.scene.add(ball)
  }

  private updateLogic() {
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
      this.ball.dy = -(this.paddle1.y - this.ball.y) / this.paddle1.h - 0.5
      this.ball.dx = 1
    }
    if (this.paddle2.intersects(this.ball.x, this.ball.y, this.ball.w, this.ball.w)) {
      this.ball.x = this.paddle2.x - this.ball.w
      this.ball.dy = -(this.paddle2.y - this.ball.y) / this.paddle2.h - 0.5
      this.ball.dx = -1
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

class PaddleComponent implements GameComponent {
  public name = 'Paddle'

  public game: PongGame
  public sprite: SpriteComponent
  public keyboard: Keyboard

  public x = 0
  public y = 0
  public w = 1
  public h = 5

  private isLeft: boolean

  public constructor(options: { isLeft: boolean }) {
    this.isLeft = options?.isLeft ?? this.isLeft
  }

  public entity: GameEntity<TransformComponent>

  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.game = entity.provider.get(PongGame)
    this.keyboard = entity.provider.get(Keyboard)
    this.sprite = entity.component(SpriteComponent)
    this.sprite.texture = this.game.whitePixel
    this.sprite.width = this.w
    this.sprite.height = this.h
    this.sprite.color = Color.White.rgba
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

  private update = () => {
    if (this.game.state === 'reset') {
      this.y = (this.game.height - this.h) / 2
      this.x = this.isLeft ? 1 : this.game.width - 1 - this.w
    }

    if (this.game.state === 'running') {
      const upKey = this.isLeft ? KeyboardKey.KeyW : KeyboardKey.KeyI
      const downKey = this.isLeft ? KeyboardKey.KeyS : KeyboardKey.KeyK
      this.y += this.keyboard.isPressed(upKey) ? 1 : 0
      this.y -= this.keyboard.isPressed(downKey) ? 1 : 0
      if (this.y < 0) {
        this.y = 0
      }
      if (this.y + this.h > this.game.height) {
        this.y = this.game.height - this.h
      }
    }

    this.entity.transform.setPosition(this.x, this.y, 0)
    this.entity.transform.update()
  }

  public intersects(x: number, y: number, w: number, h: number) {
    if (this.y > y + h) {
      return false
    }
    if (y > this.y + this.h) {
      return false
    }
    if (this.x > x + w) {
      return false
    }
    if (x > this.x + this.w) {
      return false
    }
    return true
  }
}

class BallComponent implements GameComponent {
  public game: PongGame
  public sprite: SpriteComponent

  public x = 0
  public y = 0
  public w = 1
  public h = 1
  public dx = 0
  public dy = 0
  public unitPerSec = 40

  public entity: GameEntity<TransformComponent>
  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.game = entity.provider.get(PongGame)
    this.sprite = entity.component(SpriteComponent)
    this.sprite.texture = this.game.whitePixel
    this.sprite.width = 1
    this.sprite.height = 1
    this.sprite.color = Color.White.rgba
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

  private update = (time: LoopTime) => {
    if (this.game.state === 'reset') {
      this.dx = Math.random() > 0.5 ? 1 : -1
      this.dy = 0
      this.x = this.game.width / 2
      this.y = this.game.height / 2
    }

    if (this.game.state === 'running') {
      this.x += this.dx * this.unitPerSec * time.delta
      this.y += this.dy * this.unitPerSec * time.delta
    }

    this.entity.transform.setPosition(this.x, this.y, 0)
  }
}

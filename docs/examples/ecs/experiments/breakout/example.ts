import {
  BasicGame,
  createEntity,
  LoopTime,
  SpriteComponent,
  TimeSystem,
  TransformComponent,
  TweenSystem,
} from '@gglib/components'
import { GameComponent, GameEntity, GameProvider, GameSystem } from '@gglib/ecs'

import { BlendState, Color, SamplerState, Texture } from '@gglib/graphics'
import { Keyboard, Mouse } from '@gglib/input'
import { clamp, easeInCubic, Mat4, Rect } from '@gglib/math'
import { BasicRenderPass } from '@gglib/render'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const game = new Game(canvas)
  game.run()

  TweakUi.mount(tools, (ui) => {
    ui.checkbox(game.loop, 'useFixedTimeStep', {
      label: 'Fixed time step',
    })
  })
  return () => {
    game.stop()
  }
}

class Game extends BasicGame {
  // The width and height in units.
  // Weird numbers, but fit into 16/9 aspect ratio
  public readonly width = 48
  public readonly height = 27

  public state: 'started' | 'reset' | 'running' | 'win' | 'died' = 'started'
  public background: Texture
  public sprites: Map<string, any> = new Map()

  public ball: GameEntity
  public paddle: GameEntity
  public field: GameEntity

  public constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.loop.useFixedTimeStep = false
    this.addSystem(new TweenSystem())
    this.addSystem(new TimeSystem())
    this.addSystem(new LogicComponent())
    this.provide(new Keyboard({}))
    this.provide(
      new Mouse({
        captureTarget: canvas,
        eventTarget: canvas,
        preventDefault: true,
      }),
    )
    this.camera.projection = Mat4.createOrthographicOffCenter(0, this.width, 0, this.height, 0, 100)
    this.renderer.steps = [
      new BasicRenderPass({
        blendState: BlendState.AlphaBlend,
      }),
    ]
    this.loadAssets()
    this.createObjects()
  }

  private async loadAssets() {
    this.background = await this.content.loadTexture('/textures/backgrounds/colored_castle.png')
    this.background.setupSampler(SamplerState.LinearClamp)

    const spritesheet = await this.content.loadTexture('/textures/puzzle/sheet.png')
    spritesheet.setupSampler(SamplerState.LinearWrap)

    const sprites = await this.content.fetch('/textures/puzzle/sheet.json', {
      responseType: 'json',
    })
    for (const item of sprites.body as Array<any>) {
      this.sprites.set(item.name, {
        texture: spritesheet,
        source: item,
      })
    }
  }

  private createObjects() {
    this.field = createEntity({
      components: [new SpriteComponent(), new FieldComponent()],
    })
    this.scene.add(this.field)

    this.ball = createEntity({
      name: 'Ball',
      components: [new SpriteComponent(), new GameObjectComponent({ width: 1, height: 1, sprite: 'ballGrey' })],
    })
    this.scene.add(this.ball)

    this.paddle = createEntity({
      name: 'Paddle',
      components: [new SpriteComponent(), new GameObjectComponent({ width: 5, height: 1, sprite: 'paddleBlue' })],
    })
    this.scene.add(this.paddle)
  }

  public override update() {
    this.get(Keyboard).update()
    this.get(Mouse).update()
    // console.log('Game state:', this.state)
    switch (this.state) {
      case 'started':
        this.state = 'reset'
        break
      case 'reset':
        this.state = 'running'
        break
      case 'running':
        //
        break
      case 'died':
        this.state = 'reset'
        break
      default:
        this.state = 'started'
        break
    }
  }
}

class LogicComponent implements GameSystem {
  public game: Game
  public ball: GameObjectComponent
  public paddle: GameObjectComponent
  public field: FieldComponent

  public initialize(container: GameProvider): void {
    this.game = container.get(Game)
    this.ball = this.game.ball.component(GameObjectComponent)
    this.paddle = this.game.paddle.component(GameObjectComponent)
    this.field = this.game.field.component(FieldComponent)
    this.game.loop.onUpdate.add(this.update)
  }

  public destroy(): void {
    this.game.loop.onUpdate.remove(this.update)
  }

  public update = () => {
    if (this.game.state === 'reset') {
      this.resetField()
      this.resetBall()
      return
    }
    if (this.game.state !== 'running') {
      return
    }

    this.updatePlayerInput()
    this.updateBallCollision()
    this.checkWinOrLooseCondition()
  }

  private resetField() {
    for (const child of this.field.entity.transform.children) {
      child.entity.component(GameObjectComponent).isVisible = true
    }
  }

  private resetBall() {
    this.ball.dx = 0
    this.ball.dy = 0
  }

  private updatePlayerInput() {
    const mouse = this.game.get(Mouse)
    this.paddle.speed = mouse.dxNormalized * this.game.width
    this.paddle.rect.x += this.paddle.speed
    this.paddle.rect.x = clamp(this.paddle.rect.x, 0, this.game.width - this.paddle.rect.width)
    this.paddle.rect.y = 2

    if (!this.ball.dx && !this.ball.dy) {
      if (mouse.buttonJustReleased(0)) {
        mouse.listener.lock()
        // launch the ball on mouse click
        this.ball.dx = 0
        this.ball.dy = 1
      } else {
        // stick to paddle if not launched
        this.ball.rect.setCenter(this.paddle.rect.getCenter())
        this.ball.rect.y = this.paddle.rect.yEnd
      }
    }
  }

  private updateBallCollision() {
    const ball = this.ball
    const paddle = this.paddle

    if (ball.rect.yEnd >= this.game.height) {
      ball.dy = -Math.abs(ball.dy)
    }
    if (ball.rect.x < 0) {
      ball.dx = Math.abs(ball.dx)
    }
    if (ball.rect.xEnd >= this.game.width) {
      ball.dx = -Math.abs(ball.dx)
    }
    if (ball.rect.intersects(paddle.rect)) {
      console.log(paddle.dx)

      ball.dy = Math.abs(ball.dy)
      ball.dx = paddle.speed - (paddle.rect.centerX - ball.rect.centerX) / paddle.rect.width
      ball.dx = clamp(ball.dx, -3, 3)
    }
    for (const child of this.field.entity.transform.children) {
      const block = child.entity.component(GameObjectComponent)
      if (!block.isVisible || !block.rect.intersects(ball.rect)) {
        continue
      }
      if (block.isActive) {
        block.kill()
      }
      if (ball.dy > 0 && ball.rect.yEnd >= block.rect.y && ball.rect.y < block.rect.y) {
        // hit from below
        ball.dy = -Math.abs(ball.dy)
      } else if (ball.dy < 0 && ball.rect.y <= block.rect.yEnd && ball.rect.yEnd > block.rect.yEnd) {
        // hit from above
        ball.dy = Math.abs(ball.dy)
      } else if (ball.dx < 0 && ball.rect.x <= block.rect.xEnd && ball.rect.xEnd > block.rect.xEnd) {
        // hit from right side
        ball.dx = Math.abs(ball.dx)
      } else if (ball.dx > 0 && ball.rect.xEnd >= block.rect.x && ball.rect.x < block.rect.x) {
        // hit from left side
        ball.dx = -Math.abs(ball.dx)
      }
      break
    }
  }

  private checkWinOrLooseCondition() {
    let isCleared = true
    for (const child of this.field.entity.transform.children) {
      if (child.entity.component(GameObjectComponent).isActive) {
        isCleared = false
        continue
      }
    }

    if (isCleared) {
      this.game.state = 'win'
    } else if (this.ball.rect.yEnd < 0) {
      this.game.state = 'died'
    }
  }
}

class GameObjectComponent implements GameComponent {
  private sprite: SpriteComponent
  private game: Game
  private tween: TweenSystem

  public rect = new Rect(0, 0, 1, 1)
  public z: number = 0
  public spriteName: string
  public isVisible = true
  public isActive = true
  public dx = 0
  public dy = 0
  public speed = 0

  private killProgress = 0

  public constructor(options: { x?: number; y?: number; width: number; height: number; sprite: string }) {
    this.rect.x = options.x || 0
    this.rect.y = options.y || 0
    this.rect.width = options.width
    this.rect.height = options.height
    this.spriteName = options.sprite
  }

  public entity: GameEntity<TransformComponent>

  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.game = entity.provider.get(Game)
    this.tween = entity.provider.get(TweenSystem)
    this.sprite = entity.component(SpriteComponent)
  }

  public activate(): void {
    this.game.loop.onUpdate.add(this.update)
  }

  public deactivate(): void {
    //
  }

  public destroy(): void {
    //
  }

  public update = (time: LoopTime) => {
    if (this.game.state === 'reset') {
      this.tween.cancelAll()
      this.isVisible = true
      this.isActive = true
      this.killProgress = 0
    }
    if (this.game.state === 'running') {
      this.rect.x += this.dx * 20 * time.delta
      this.rect.y += this.dy * 20 * time.delta
    }
    if (this.isVisible) {
      this.sprite.setSource(this.game.sprites.get(this.spriteName))
      this.sprite.pivotX = 0.5
      this.sprite.pivotY = 0.5
      this.sprite.width = (1 - this.killProgress) * this.rect.width
      this.sprite.height = (1 - this.killProgress) * this.rect.height
      this.sprite.color = Color.xyzw(1, 1, 1, 1 - this.killProgress)
    } else {
      this.sprite.setSource(null)
    }

    this.entity.transform.setPosition(this.rect.getX(0.5), this.rect.getY(0.5) + this.killProgress, this.z)
  }

  public kill() {
    if (!this.isActive) {
      return
    }
    this.isActive = false
    this.tween
      .start({
        from: [0],
        to: [1],
        durationInMs: 300,
        ease: easeInCubic,
      })
      .onUpdate.add((tween) => {
        this.killProgress = tween.values[0]
        this.isVisible = tween.progress < 1
      })
  }
}

class FieldComponent implements GameComponent {
  public game: Game
  public sprite: SpriteComponent

  public entity: GameEntity<TransformComponent>
  public initialize(entity: GameEntity<TransformComponent>): void {
    this.entity = entity
    this.game = entity.provider.get(Game)
    this.sprite = entity.component(SpriteComponent)
    const cols = 10
    const rows = 5
    const width = 4
    const pad = Math.floor((this.game.width - cols * width) / 2)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const child = createEntity({
          name: 'block',
          components: [
            new SpriteComponent(),
            new GameObjectComponent({
              x: pad + x * width,
              y: 10 + y * 2,
              width: width,
              height: 1,
              sprite: 'element_blue_rectangle',
            }),
          ],
        })
        this.entity.transform.addChild(child.transform)
        child.initialize(entity.provider)
      }
    }
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
    if (!this.sprite.texture) {
      this.sprite.texture = this.game.background
      this.sprite.width = this.game.width
      this.sprite.height = this.game.width
      this.sprite.pivotY = 0.25
    }
  }
}

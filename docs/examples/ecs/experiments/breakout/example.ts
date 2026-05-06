import {
  BasicGame,
  BehaviorComponent,
  MouseInputSystem,
  SpriteComponent,
  TransformComponent,
  TweenSystem,
} from '@gglib/components'
import { GameComponent, GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import { PlatformId, Texture } from '@gglib/graphics'
import { Keyboard } from '@gglib/input'
import { clamp, easeInCubic, IRect, Mat4, Rect } from '@gglib/math'
import { BloomPass, LayerMask, PixelatePass, VignettePass } from '@gglib/render'
import { mountUi } from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new Game(canvas, platform)
  game.run()

  mountUi(tools, (ui) => {
    ui.boolean(game.loop, 'useFixedTimeStep', {
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

  public state: 'started' | 'reset' | 'running' | 'win' | 'loose' = 'started'
  public background!: Texture
  public sprites: Map<string, { texture: Texture; source: IRect }> = new Map()

  public ball!: GameEntity
  public paddle!: GameEntity
  public field!: GameEntity

  public constructor(canvas: HTMLCanvasElement, platform: PlatformId = 'auto') {
    super({ canvas, platform })
    this.loop.useFixedTimeStep = false
    this.world.addSystem(new LogicComponent())
    this.world.addSystem(new Keyboard({}))
    this.world.addSystem(
      new MouseInputSystem({
        captureTarget: canvas,
        eventTarget: canvas,
        preventDefault: true,
      }),
    )
    this.view.camera = {
      projection: Mat4.createOrthographicOffCenter(0, this.width, 0, this.height, 0, 100, this.device.ndcMinZ),
      view: Mat4.createIdentity(),
      world: Mat4.createIdentity(),
      visibilityMask: LayerMask.All,
      reversedZ: false,
    }
    this.createObjects()
  }

  public override async run() {
    await super.run()
    await this.loadAssets()
    this.renderer.pipeline.addPass(
      new PixelatePass(this.device, {
        enabled: false,
        corner: 1,
      }),
      new BloomPass(this.device, {
        enabled: false,
      }),
      new VignettePass(this.device, {
        enabled: true,
      }),
    )
    this.scene.activate()
  }

  private async loadAssets() {
    this.background = await this.content.loadTexture('/textures/backgrounds/colored_castle.png')
    const spritesheet = await this.content.loadTexture('/textures/puzzle/sheet.png')
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
    this.field = this.createEntity({
      name: 'Field',
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new SpriteComponent(), new FieldComponent()],
    })

    this.ball = this.createEntity({
      name: 'Ball',
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new SpriteComponent(), new GameObjectComponent({ width: 1, height: 1, sprite: 'ballGrey' })],
    })

    this.paddle = this.createEntity({
      name: 'Paddle',
      parent: this.scene,
      transform: new TransformComponent(),
      components: [new SpriteComponent(), new GameObjectComponent({ width: 5, height: 1, sprite: 'paddleBlue' })],
    })
  }

  public override update(time: number, dt: number) {
    super.update(time, dt)
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
      case 'loose':
        this.state = 'reset'
        break
      default:
        this.state = 'started'
        break
    }
  }
}

class LogicComponent extends GameSystem {
  public game!: Game
  public ball!: GameObjectComponent
  public paddle!: GameObjectComponent
  public field!: FieldComponent

  public initialize(world: GameWorld): void {
    this.game = world.getSystem(Game)
    this.ball = this.game.ball.component(GameObjectComponent)
    this.paddle = this.game.paddle.component(GameObjectComponent)
    this.field = this.game.field.component(FieldComponent)
  }

  public destroy(): void {
    //
  }

  public update() {
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
    for (const child of this.field.entity.getTransform()!.children) {
      child.entity.component(GameObjectComponent).isVisible = true
    }
  }

  private resetBall() {
    this.ball.dx = 0
    this.ball.dy = 0
  }

  private updatePlayerInput() {
    const mouse = this.game.world.getSystem(MouseInputSystem)
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
    for (const child of this.field.entity.getTransform()!.children) {
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
    for (const child of this.field.entity.getTransform()!.children) {
      if (child.entity.component(GameObjectComponent).isActive) {
        isCleared = false
        continue
      }
    }

    if (isCleared) {
      this.game.state = 'win'
    } else if (this.ball.rect.yEnd < 0) {
      this.game.state = 'loose'
    }
  }
}

class GameObjectComponent implements GameComponent, BehaviorComponent {
  private sprite!: SpriteComponent
  private game!: Game
  private tween!: TweenSystem

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

  public readonly entity!: GameEntity
  public initialize(): void {
    this.game = this.entity.service(Game)
    this.tween = this.entity.service(TweenSystem)
    this.sprite = this.entity.component(SpriteComponent)
  }

  public updateBehavior(time: number, dt: number) {
    if (this.game.state === 'reset') {
      this.tween.cancelAll()
      this.isVisible = true
      this.isActive = true
      this.killProgress = 0
    }
    if (this.game.state === 'running') {
      this.rect.x += (this.dx * 20 * dt) / 1000
      this.rect.y += (this.dy * 20 * dt) / 1000
    }
    const sprite = this.game.sprites.get(this.spriteName)!
    if (this.isVisible && sprite) {
      this.sprite.setTexture(sprite.texture)
      this.sprite.setSource(sprite.source.x, sprite.source.y, sprite.source.width, sprite.source.height)
      this.sprite.setPivot(0.5, 0.5)
      this.sprite.setSize((1 - this.killProgress) * this.rect.width, (1 - this.killProgress) * this.rect.height)
      //this.sprite.setColor(Color.xyzw(1, 1, 1, 1 - this.killProgress))
    } else {
      this.sprite.setTexture(null!)
    }

    this.entity
      .getTransform<TransformComponent>()!
      .setPosition(this.rect.getX(0.5), this.rect.getY(0.5) + this.killProgress, this.z)
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
      .bind((tween) => {
        this.killProgress = tween.value
        this.isVisible = tween.progress < 1
      })
  }
}

class FieldComponent implements GameComponent, BehaviorComponent {
  public game!: Game
  public sprite!: SpriteComponent

  public readonly entity!: GameEntity
  public initialize(): void {
    this.game = this.entity.service(Game)
    this.sprite = this.entity.component(SpriteComponent)
    const cols = 10
    const rows = 5
    const width = 4
    const pad = Math.floor((this.game.width - cols * width) / 2)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        this.game.createEntity({
          name: 'block',
          parent: this.entity,
          transform: new TransformComponent(),
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
      }
    }
  }

  public updateBehavior(time: number, delta: number): void {
    this.sprite.setTexture(this.game.background)
    this.sprite.setSize(this.game.width, this.game.height)
    this.sprite.setPivot(0, 0)
    this.entity.getTransform<TransformComponent>()!.setPosition(0, 0, -0.1)
  }
}

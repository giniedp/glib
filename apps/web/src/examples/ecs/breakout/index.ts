import {
  createGame,
  KeyboardComponent,
  RendererComponent,
  SceneryLinkComponent,
  SpriteComponent,
  TransformComponent,
  MouseComponent,
  TweenComponent,
  SpriteSourceOptions,
} from '@gglib/components'

import { forwardRef, Inject, OnInit, OnUpdate, Component, Entity, OnAdded, OnSetup } from '@gglib/ecs'
import { Texture, BlendState, Color } from '@gglib/graphics'
import { Mat4, Rect, easeInCubic } from '@gglib/math'
import { CameraData, BasicRenderStep } from '@gglib/render'
import { Events } from '@gglib/utils'
import { ContentManager } from '@gglib/content'

// This component will act as an asset bucket.
// No other component actually loads assets by itself
// but instead asks this component for textures etc.
@Component()
class AssetsComponent extends Events implements OnInit {
  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  // The only content this game needs is a sprite sheet.
  public sprites: Map<string, SpriteSourceOptions> = new Map()
  public background: Texture

  public async onInit() {
    this.background = await this.content.load('/assets/textures/backgrounds/colored_castle.png', Texture.Texture2D)
    const [texture, sprites] = await Promise.all([
      this.content.load('/assets/textures/puzzle/sheet.png', Texture.Texture2D),
      this.content.downloadJSON('/assets/textures/puzzle/sheet.json'),
    ])
    for (const item of sprites.content as Array<any>) {
      this.sprites.set(item.name, {
        texture: texture,
        source: item,
      })
    }
  }
}

@Component({
  // before this component is initialized
  // the following components are automatically installed
  // on the entity
  install: [
    RendererComponent,
    KeyboardComponent,
    MouseComponent,
    // The AssetsComponent as declared above
    AssetsComponent,
    // The LogicComponent is declared later in code
    // so the symbol is undefined at this point.
    // We have to use `forwardRef` which will be resolved during install.
    forwardRef(() => LogicComponent),
  ],
})
class BreakoutGame extends Events implements OnAdded, OnInit, OnUpdate {
  @Inject(Entity)
  public entity: Entity

  @Inject(RendererComponent)
  public renderer: RendererComponent

  @Inject(AssetsComponent)
  public assets: AssetsComponent

  // The width and height in units.
  // Weird numbers, but fit into 21/9 aspect ratio
  // which is used for all examples
  public readonly width = 63
  public readonly height = 27

  // This is a 2D game, so we use an orthographic projection
  // that convers the whole game field
  public readonly camera: CameraData = {
    view: Mat4.createIdentity(),
    projection: Mat4.createOrthographicOffCenter(0, this.width, 0, this.height, 0, 100),
  }

  // Our game state is very primitive here
  public state: 'started' | 'reset' | 'running' | 'win' | 'died' = 'started'

  // When this component is actually added to an entity
  // we create all other game objects:
  // - the game field
  // - the paddle
  // - and the ball
  public onAdded(e: Entity) {
    e.createChild((child) => {
      child.name = 'Field'
      child.install(FieldComponent)
    })
    e.createChild((child) => {
      child.name = 'Paddle'
      child.install(GameObjectComponent, { width: 5, height: 1, sprite: 'paddleBlue' })
    })
    e.createChild((child) => {
      child.name = 'Ball'
      child.install(GameObjectComponent, { width: 1, height: 1, sprite: 'ballGrey' })
    })
  }

  public async onInit() {
    this.renderer.scene.camera = this.camera
    const renderStep = this.renderer.scene.steps[0] as BasicRenderStep
    renderStep.blendState = BlendState.AlphaBlend
    renderStep.clearColor = 0xff2e2620
  }

  public onUpdate() {
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

@Component()
class LogicComponent implements OnUpdate {
  @Inject(BreakoutGame, { from: 'root' })
  public game: BreakoutGame

  @Inject(MouseComponent, { from: 'root' })
  public mouse: MouseComponent

  @Inject(forwardRef(() => GameObjectComponent), { from: '/Ball' })
  public ball: GameObjectComponent

  @Inject(forwardRef(() => GameObjectComponent), { from: '/Paddle' })
  public paddle: GameObjectComponent

  @Inject(forwardRef(() => FieldComponent), { from: '/Field' })
  public field: FieldComponent

  public onUpdate() {
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
    // for (const entity of this.field.entity.children) {
    //   entity.get(GameObjectComponent).isVisible = true
    // }
  }

  private resetBall() {
    this.ball.dx = 0
    this.ball.dy = 0
  }

  private updatePlayerInput() {
    this.paddle.rect.x = this.game.width * this.mouse.xNormalized - this.paddle.rect.width / 2
    this.paddle.rect.y = 2
    if (!this.ball.dx && !this.ball.dy) {
      if (this.mouse.buttonJustReleased(0)) {
        this.ball.dx = 0
        this.ball.dy = 1
        this.mouse.mouse.lock()
      } else {
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
      ball.dy = Math.abs(ball.dy)
      ball.dx = -((paddle.rect.centerX - ball.rect.centerX) / paddle.rect.width) * 2
    }
    for (const entity of this.field.entity.children) {
      const block = entity.get(GameObjectComponent)
      if (!block.isActive || !block.rect.intersects(ball.rect)) {
        continue
      }
      block.kill()
      if (ball.dy > 0 && ball.rect.yEnd >= block.rect.y && ball.rect.y < block.rect.y) {
        // hot from below
        ball.dy = -Math.abs(ball.dy)
      }
      else if (ball.dy < 0 && ball.rect.y <= block.rect.yEnd && ball.rect.yEnd > block.rect.yEnd) {
        // hot from above
        ball.dy = Math.abs(ball.dy)
      }
      else if (ball.dx < 0 && ball.rect.x <= block.rect.xEnd && ball.rect.xEnd > block.rect.xEnd) {
        // hit from right side
        ball.dx = Math.abs(ball.dx)
      }
      else if (ball.dx > 0 && ball.rect.xEnd >= block.rect.x && ball.rect.x < block.rect.x) {
        // hit from left side
        ball.dx = -Math.abs(ball.dx)
      }
      break
    }
  }

  private checkWinOrLooseCondition() {
    const fieldCleared = this.field.entity.children.every((e) => !e.get(GameObjectComponent).isActive)
    if (fieldCleared) {
      this.game.state = 'win'
    } else if (this.ball.rect.yEnd < 0) {
      this.game.state = 'died'
    }
  }
}

// A very basic game object that implements all we actually
// need for all main objects.
@Component({
  install: [SceneryLinkComponent, TransformComponent, SpriteComponent, TweenComponent],
})
class GameObjectComponent implements OnSetup<any>, OnUpdate {
  @Inject(SpriteComponent)
  private sprite: SpriteComponent

  @Inject(TransformComponent)
  private transform: TransformComponent

  @Inject(AssetsComponent, { from: 'root' })
  private assets: AssetsComponent

  @Inject(BreakoutGame, { from: 'root' })
  private game: BreakoutGame

  @Inject(TweenComponent)
  private tween: TweenComponent

  public rect = new Rect(0, 0, 1, 1)
  public z: number = 0
  public spriteName: string
  public isVisible = true
  public isActive = true
  public dx = 0
  public dy = 0
  private killProgress = 0

  public onSetup(options: { x?: number; y?: number; width: number; height: number; sprite: string }) {
    this.rect.x = options.x || 0
    this.rect.y = options.y || 0
    this.rect.width = options.width
    this.rect.height = options.height
    this.spriteName = options.sprite
  }

  public onUpdate(dt: number) {
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
    if (this.isVisible) {
      this.sprite.setSource(this.assets.sprites.get(this.spriteName))
      this.sprite.pivotX = 0.5
      this.sprite.pivotY = 0.5
      this.sprite.width = (1 - this.killProgress) * this.rect.width
      this.sprite.height = (1 - this.killProgress) * this.rect.height
      this.sprite.color = Color.xyzw(1, 1, 1, 1 - this.killProgress)
    } else {
      this.sprite.setSource(null)
    }

    this.transform.setPosition(this.rect.getX(0.5), this.rect.getY(0.5) + this.killProgress, this.z)
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
      .onUpdateEvent((tween) => {
        this.killProgress = tween.values[0]
        this.isVisible = tween.progress < 1
      })
  }
}

@Component({
  install: [SpriteComponent, TransformComponent],
})
class FieldComponent implements OnInit, OnUpdate {
  public name = 'Field'

  @Inject(BreakoutGame, { from: 'root' })
  public game: BreakoutGame

  @Inject(Entity)
  public entity: Entity

  @Inject(SpriteComponent)
  public sprite: SpriteComponent

  @Inject(AssetsComponent, { from: 'root' })
  public assets: AssetsComponent

  public async onInit(e: Entity) {
    const cols = 10
    const rows = 5
    const width = 4
    const pad = Math.floor((this.game.width - cols * width) / 2)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        e.createChild((child) => {
          child.name = `block`
          child.install(GameObjectComponent, {
            x: pad + x * width,
            y: 10 + y * 2,
            width: width,
            height: 1,
            sprite: 'element_blue_rectangle',
          })
        })
      }
    }
  }

  public onUpdate() {
    if (!this.sprite.texture) {
      this.sprite.texture = this.assets.background
      this.sprite.width = this.game.width
      this.sprite.height = this.game.width
      this.sprite.pivotY = 0.25
    }
  }
}

createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}).install(BreakoutGame)

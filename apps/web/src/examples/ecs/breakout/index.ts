import {
  createGame,
  KeyboardComponent,
  RendererComponent,
  SceneryLinkComponent,
  SpriteComponent,
  TransformComponent,
  MouseComponent,
  SpriteData,
  SpriteMode,
} from '@gglib/components'

import { forwardRef, Inject, OnInit, OnUpdate, Component, Entity, OnAdded, OnSetup } from '@gglib/ecs'
import { Color, Texture, Device, BlendState } from '@gglib/graphics'
import { KeyboardKey } from '@gglib/input'
import { Mat4 } from '@gglib/math'
import { CameraData, BasicRenderStep } from '@gglib/render'
import { Events } from '@gglib/utils'
import { ContentManager } from '@gglib/content'

@Component()
class AssetsComponent extends Events implements OnInit {

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  public sprites: Map<string, SpriteData> = new Map()

  public async onInit() {
    const [texture, sprites] = await Promise.all([
      this.content.load<Texture>('/assets/textures/puzzle/sheet.png', Texture.Texture2D),
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
  install: [
    AssetsComponent,
    RendererComponent,
    KeyboardComponent,
    MouseComponent,
    forwardRef(() => LogicComponent),
  ]
})
class BreakoutGame extends Events implements OnAdded, OnInit, OnUpdate {

  @Inject(Entity)
  public entity: Entity

  @Inject(RendererComponent)
  public renderer: RendererComponent

  @Inject(Device, { from: 'root' })
  public device: Device

  @Inject(AssetsComponent)
  public assets: AssetsComponent

  public readonly width = 63
  public readonly height = 27

  public readonly camera: CameraData = {
    view: Mat4.createIdentity(),
    projection: Mat4.createOrthographicOffCenter(0, this.width, 0, this.height, 0, 100),
  }

  public state: 'started' | 'reset' | 'running' | 'died' = 'started'
  public scoreLeft = 0
  public scoreRight = 0

  public onAdded(e: Entity) {
    e.createChild((child) => {
      child.name = 'Field'
      child.install(FieldComponent)
    })
    e.createChild((child) => {
      child.name = 'Paddle'
      child.install(PaddleComponent)
    })
    e.createChild((child) => {
      child.name = 'Ball'
      child.install(BallComponent)
    })
  }

  public async onInit() {
    this.renderer.scene.camera = this.camera;
    const renderStep = this.renderer.scene.steps[0] as BasicRenderStep
    renderStep.blendState = BlendState.AlphaBlend
    renderStep.clearColor = 0xff2e2620 // Color.White.rgba
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

  @Inject(forwardRef(() => BallComponent), { from: '/Ball' })
  public ball: BallComponent

  @Inject(forwardRef(() => PaddleComponent), { from: '/Paddle' })
  public paddle: PaddleComponent

  @Inject(forwardRef(() => FieldComponent), { from: '/Field' })
  public field: FieldComponent

  public onUpdate() {
    if (this.game.state !== 'running') {
      return
    }

    // if (this.paddle1.intersects(this.ball.x, this.ball.y, this.ball.w, this.ball.w)) {
    //   this.ball.x = this.paddle1.x + this.paddle1.w
    //   this.ball.dy = -(this.paddle1.y - this.ball.y) / this.paddle1.h - 0.5
    //   this.ball.dx = 1
    // }
    // if (this.paddle2.intersects(this.ball.x, this.ball.y, this.ball.w, this.ball.w)) {
    //   this.ball.x = this.paddle2.x - this.ball.w
    //   this.ball.dy = -(this.paddle2.y - this.ball.y) / this.paddle2.h - 0.5
    //   this.ball.dx = -1
    // }
    // if (this.ball.y + this.ball.h > this.game.height) {
    //   this.ball.y = this.game.height - this.ball.h
    //   this.ball.dy = -Math.abs(this.ball.dy)
    // }
    // if (this.ball.y < 0) {
    //   this.ball.y = 0
    //   this.ball.dy = Math.abs(this.ball.dy)
    // }
    if (this.ball.y < 0) {
      this.game.state = 'died'
    }
  }
}

@Component({
  install: [
    SpriteComponent,
    TransformComponent,
    KeyboardComponent
  ]
})
class PaddleComponent implements OnInit, OnUpdate {

  @Inject(SpriteComponent)
  public readonly renderable: SpriteComponent

  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  @Inject(KeyboardComponent, { from: 'root' })
  public readonly keyboard: KeyboardComponent

  @Inject(BreakoutGame, { from: 'root' })
  public readonly game: BreakoutGame

  public x = 0
  public y = 0
  public w = 5
  public h = 1

  public async onInit() {
    this.x = Math.floor(this.game.width / 2 - this.w / 2)
    this.y = Math.floor(2 * this.h)
    this.renderable.width = this.w
    this.renderable.height = this.h
    this.renderable.color = Color.White.rgba
  }

  public onUpdate() {
    this.renderable.mode = SpriteMode.Default
    this.renderable.sprite = this.game.assets.sprites.get('paddleBlue')
    if (this.game.state === 'reset') {
      this.x = Math.floor(this.game.width / 2 - this.w / 2)
      this.y = Math.floor(2 * this.h)
    }

    if (this.game.state === 'running') {
      this.x -= this.keyboard.isPressed(KeyboardKey.ArrowLeft) ? 1 : 0
      this.x += this.keyboard.isPressed(KeyboardKey.ArrowRight) ? 1 : 0
      this.x = Math.max(this.x, 0)
      this.x = Math.min(this.x, this.game.width - this.w)
    }

    this.transform.setPosition(this.x, this.y, 0)
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

@Component({
  install: [
    SceneryLinkComponent,
    TransformComponent,
    SpriteComponent,
  ]
})
class BallComponent implements OnInit, OnUpdate {

  @Inject(BreakoutGame, { from: 'root' })
  public game: BreakoutGame

  @Inject(SpriteComponent)
  public sprite: SpriteComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  public async onInit() {
    this.sprite.width = 1
    this.sprite.height = 1
    this.sprite.color = Color.White.rgba
  }

  public x = 0
  public y = 0
  public w = 1
  public h = 1
  public dx = 0
  public dy = 0
  public unitPerSec = 20

  public onUpdate(dt: number) {
    if (this.game.state === 'reset') {
      this.dx = Math.random() > 0.5 ? 1 : -1
      this.dy = 0
      this.x = this.game.width / 2
      this.y = this.game.height / 2
    }

    if (this.game.state === 'running') {
      this.x += (this.dx * this.unitPerSec * dt) / 1000
      this.y += (this.dy * this.unitPerSec * dt) / 1000
    }

    this.transform.setPosition(this.x, this.y, 0)
  }
}

@Component({
  install: [
    SpriteComponent,
    TransformComponent,
  ]
})
class FieldComponent implements OnInit {
  public name = 'Field'

  @Inject(BreakoutGame, { from: 'root' })
  public game: BreakoutGame

  @Inject(SpriteComponent)
  public renderable: SpriteComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(Entity)
  public entity: Entity


  public async onInit(e: Entity) {
    this.renderable.width = this.game.width
    this.renderable.height = this.game.height
    this.renderable.color = Color.CornflowerBlue.rgba
    this.transform.setPosition(0, 0, -1)

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
            sprite: 'element_blue_rectangle'
          })
        })
      }
    }
  }
}

@Component({
  install: [
    SceneryLinkComponent,
    TransformComponent,
    SpriteComponent
  ]
})
class GameObjectComponent implements OnSetup<any>, OnUpdate {

  @Inject(SpriteComponent)
  private renderable: SpriteComponent

  @Inject(TransformComponent)
  private transform: TransformComponent

  @Inject(AssetsComponent, { from: 'root' })
  private assets: AssetsComponent

  public x: number = 0
  public y: number = 0
  public z: number = 0
  public width: number = 1
  public height: number = 1
  public sprite: string

  public onSetup(options: { x: number, y: number, width: number, height: number, sprite: string }) {
    this.x = options.x
    this.y = options.y
    this.width = options.width
    this.height = options.height
    this.sprite = options.sprite
  }

  public onUpdate() {
    this.renderable.width = this.width
    this.renderable.height = this.height
    this.renderable.sprite = this.assets.sprites.get(this.sprite)

    this.transform.setPosition(this.x, this.y, this.z)
  }
}

createGame(
  {
    device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
    autorun: true,
  },
  (e) => e.install(BreakoutGame),
)

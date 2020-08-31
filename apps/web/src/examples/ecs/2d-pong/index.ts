import {
  createGame,
  KeyboardComponent,
  RendererComponent,
  SpriteComponent,
  TransformComponent,
} from '@gglib/components'

import { forwardRef, Inject, OnInit, OnUpdate, Component, OnSetup } from '@gglib/ecs'
import { Color, PixelFormat, Texture } from '@gglib/graphics'
import { KeyboardKey } from '@gglib/input'
import { Mat4 } from '@gglib/math'
import { CameraData } from '@gglib/render'
import { getOption } from '@gglib/utils'

@Component({
  install: [
    RendererComponent,
    KeyboardComponent,
    forwardRef(() => LogicComponent),
  ]
})
class PongGame implements OnInit, OnUpdate {

  @Inject(RendererComponent)
  public renderer: RendererComponent

  // Here we define the dimensions of the play area.
  // Other components must `@Inject(PongGame)` in order
  // to get this information
  public width = 63
  public height = 27

  public state: 'started' | 'reset' | 'running' | 'scored' = 'started'
  public whitePixel: Texture
  public scoreLeft = 0
  public scoreRight = 0

  // This game uses a static camera without a dedicated entity or component.
  // The projection matrix simply covers the whole play area.
  private camera: CameraData = {
    view: Mat4.createIdentity(),
    projection: Mat4.createOrthographicOffCenter(0, this.width, 0, this.height, 0, 100),
  }

  public onInit() {
    // The render manager already contains a default scene
    // but no camera. We must provide that.
    this.renderer.scene.camera = this.camera
    // All components will render this white pixel texture as a sprite
    this.whitePixel = this.renderer.device.createTexture({
      source: [0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF],
      width: 1, height: 1, pixelFormat: PixelFormat.RGBA,
    })
  }

  public onUpdate() {
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
  }

  public onScoreLeft() {
    this.scoreLeft++
    this.state = 'scored'
  }

  public onScoreRight() {
    this.scoreRight++
    this.state = 'scored'
  }
}

@Component()
class LogicComponent implements OnUpdate {

  // Inject the PongGame in order to access the play area dimensions.
  @Inject(PongGame)
  public game: PongGame

  // Inject the other components with the use of `forwardRef` helper.
  // This is needed, because when the `@Inject` is evaluated the other
  // components are not yet defined.
  @Inject(forwardRef(() => BallComponent), { from: '/Ball'})
  public ball: BallComponent

  @Inject(forwardRef(() => PaddleComponent), { from: '/Paddle1'})
  public paddle1: PaddleComponent

  @Inject(forwardRef(() => PaddleComponent), { from: '/Paddle2'})
  public paddle2: PaddleComponent

  // Unless the game is not running this component does nothing.
  // Otherwise perform several boundary and collision checks
  // to determine whether a player has scored a goal or a paddle
  // did hit the ball.
  public onUpdate() {

    if (this.game.state !== 'running') {
      return
    }

    if (this.ball.x + this.ball.w < 0) {
      this.game.onScoreRight()
    }
    if (this.ball.x > this.game.width) {
      this.game.onScoreLeft()
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
    if (this.ball.y + this.ball.h > this.game.height) {
      this.ball.y = this.game.height - this.ball.h
      this.ball.dy = -Math.abs(this.ball.dy)
    }
    if (this.ball.y < 0) {
      this.ball.y = 0
      this.ball.dy = Math.abs(this.ball.dy)
    }
  }
}

@Component({
  install: [
    TransformComponent,
    SpriteComponent,
  ]
})
class PaddleComponent implements OnInit, OnUpdate, OnSetup<{ isLeft: boolean }> {
  public name = 'Paddle'

  @Inject(SpriteComponent)
  public sprite: SpriteComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(KeyboardComponent, { from: 'root' })
  public keyboard: KeyboardComponent

  @Inject(PongGame, { from: 'root' })
  public game: PongGame

  public x = 0
  public y = 0
  public w = 1
  public h = 5

  private isLeft: boolean

  public onSetup(options: { isLeft: boolean }) {
    this.isLeft = getOption(options, 'isLeft', this.isLeft)
  }

  public async onInit() {
    this.sprite.texture = this.game.whitePixel
    this.sprite.width = this.w
    this.sprite.height = this.h
    this.sprite.color = Color.White.rgba
  }

  public onUpdate() {
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

// The BacllComponent renders the ball sprite and
// updates its position according to its movement state.
@Component({
  install: [
    SpriteComponent,
    TransformComponent,
  ]
})
class BallComponent implements OnInit, OnUpdate {
  public name = 'Ball'

  @Inject(PongGame, { from: 'root' })
  public game: PongGame

  @Inject(SpriteComponent)
  public sprite: SpriteComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  public async onInit() {
    this.sprite.texture = this.game.whitePixel
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
      this.x += this.dx * this.unitPerSec * dt / 1000
      this.y += this.dy * this.unitPerSec * dt / 1000
    }

    this.transform.setPosition(this.x, this.y, 0)
  }
}

// The FieldComponent simply fills the screen with a backgorund color
@Component({
  install: [
    SpriteComponent,
    TransformComponent,
  ]
})
class FieldComponent implements OnInit {
  public name = 'Field'

  @Inject(PongGame, { from: 'root' })
  public game: PongGame

  @Inject(SpriteComponent)
  public renderable: SpriteComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  public async onInit() {
    this.renderable.texture = this.game.whitePixel
    this.renderable.width = this.game.width
    this.renderable.height = this.game.height
    this.renderable.color = Color.CornflowerBlue.rgba
    this.transform.setPosition(0, 0, -1)
  }
}

// Now build up the entity component tree for the game
createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}, (e) => {
  e.name = 'Pong'
  e.install(PongGame)
})
.createChild((e) => {
  e.name = 'Field'
  e.install(FieldComponent)
})
.createChild((e) => {
  e.name = 'Paddle1'
  e.install(PaddleComponent, { isLeft: true })
})
.createChild((e) => {
  e.name = 'Paddle2'
  e.install(PaddleComponent, { isLeft: false })
})
.createChild((e) => {
  e.name = 'Ball'
  e.install(BallComponent)
})

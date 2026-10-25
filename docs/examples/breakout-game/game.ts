import { AudioAssetType, AudioDevice } from '@gglib/components'
import { ContentLoader } from '@gglib/content'
import { Game, MouseInput, MouseListener, TouchPane } from '@gglib/game'
import { BlendState, Color, PlatformId, SpriteBatch, SpriteMode, Texture } from '@gglib/graphics'
import { clamp, IRect, Mat4, mat4$initOrthographicOffCenter, mat4Identity, rectGetX, rectGetY } from '@gglib/math'
import { mount } from 'tweak-ui'
import { getCircleRectHit, HitAxis } from './collision'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new BreakoutGame({ canvas, platform, autosize: true })
  game.run()

  const panel = mount(tools, (ui) => {
    ui.bool(game.loop, 'useFixedTimeStep', {
      label: 'Fixed time step',
    })
  })
  return () => {
    game.destroy()
    panel.dispose()
  }
}

class BreakoutGame extends Game {
  // The width in units is fixed. The height grows on narrow screens,
  // the blocks stay at the top and the paddle at the bottom
  public readonly width = 48
  public readonly minHeight = 27
  public height = 0

  public state: 'started' | 'reset' | 'running' | 'win' | 'loose' = 'started'
  public sprites: Map<string, { texture: Texture; source: IRect }> = new Map()

  public content!: ContentLoader
  public mouse!: MouseInput
  public touch!: TouchPane
  public spriteBatch!: SpriteBatch
  public projection: Mat4 = mat4Identity()

  public ball!: GameBlock
  public paddle!: GameBlock
  public blocks!: GameBlock[]
  public particles: Particle[] = []
  public audio!: AudioDevice
  public sounds: AudioBuffer[] = []
  public score: number = 0
  public streak: number = 0
  public scoreChangedAt = -1
  public time = 0

  // once a touch was seen, the paddle moves up and leaves a zone below it for the finger
  public isTouch = false
  public lastTouch: Touch | null = null

  public get touchZone() {
    return this.isTouch ? Math.max(6, this.height * 0.15) : 0
  }

  public override onCreate(): void {
    const canvas = this.device.canvas as HTMLCanvasElement
    this.content = new ContentLoader(this.device)
    this.mouse = new MouseInput({
      provider: new MouseListener({
        captureTarget: canvas,
        eventTarget: canvas,
        preventDefault: true,
      }),
    })
    this.touch = new TouchPane({ eventTarget: canvas })
    this.touch.preventDefault = true
    // no scrolling or zooming while the finger is on the game
    canvas.style.touchAction = 'none'
    this.audio = new AudioDevice()
  }

  public override destroy(): void {
    super.destroy()
    this.touch.deactivate()
    this.audio.destroy()
  }

  public override onInitialize() {
    this.spriteBatch = new SpriteBatch(this.device)
    this.ball = gameBlock({
      type: 'block',
      width: 1,
      height: 1,
      sprite: 'ballGrey',
    })
    this.paddle = gameBlock({
      type: 'paddle',
      width: 5,
      height: 1,
      sprite: 'paddleBlue',
    })
    this.blocks = []
    const cols = 10
    const rows = 7
    const width = 4
    const pad = Math.floor((this.width - cols * width) / 2)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let points = 1
        let color = 'blue'
        if (y >= 1) {
          points = 3
          color = 'green'
        }
        if (y >= 3) {
          points = 5
          color = 'purple'
        }
        if (y >= 5) {
          points = 7
          color = 'red'
        }
        this.blocks.push(
          gameBlock({
            type: 'block',
            x: pad + x * width,
            // the top row is 5 units below the top edge
            top: 5 + (rows - 1 - y) * 2,
            width: width,
            height: 1,
            sprite: `element_${color}_rectangle`,
            shard: `element_${color}_square`,
            points,
          }),
        )
      }
    }
  }

  override async onLoadContent() {
    const puzzleSprite = await this.content.loadTexture('/sprites/puzzle.png')
    const puzzleSprites = await this.content.fetch('/sprites/puzzle.sheet.json', {
      responseType: 'json',
    })
    const fishSprite = await this.content.loadTexture('/sprites/fish.png')
    const fishSprites = await this.content.fetch('/sprites/fish.sheet.json', {
      responseType: 'json',
    })
    for (const item of puzzleSprites.body as Array<any>) {
      this.sprites.set(item.name, {
        texture: puzzleSprite,
        source: item,
      })
    }
    for (const item of fishSprites.body as Array<any>) {
      this.sprites.set(item.name, {
        texture: fishSprite,
        source: item,
      })
    }
    this.sounds = await Promise.all(
      [
        '/audio/impact/impactGlass_medium_000.ogg',
        '/audio/impact/impactGlass_medium_001.ogg',
        '/audio/impact/impactGlass_medium_002.ogg',
        '/audio/impact/impactGlass_medium_003.ogg',
        '/audio/impact/impactGlass_medium_004.ogg',
      ].map((url) => this.content.load(AudioAssetType, url)),
    )
  }

  public override onUpdate(time: number, dt: number) {
    this.time = time
    this.mouse.update()
    this.updateLayout()
    this.updateParticles(dt)
    switch (this.state) {
      case 'started':
        this.state = 'reset'
        break
      case 'reset':
        this.streak = 0
        // score will be reset when ball launches
        // this.score = 0
        this.resetField()
        this.resetBall()
        this.state = 'running'
        break
      case 'running':
        this.updatePlayerInput(dt)
        this.updateBallCollision()
        this.checkWinOrLooseCondition()
        break
      case 'win':
      case 'loose':
        this.state = 'reset'
        break
      default:
        this.state = 'started'
        break
    }
  }

  /**
   * Fits the height to the aspect ratio of the screen and moves the blocks with the top edge
   */
  private updateLayout() {
    const height = Math.max(this.minHeight, this.width / this.device.output.aspectRatio)
    if (height === this.height) {
      return
    }
    this.height = height
    mat4$initOrthographicOffCenter(this.projection, 0, this.width, 0, this.height, 0, 100, this.device.ndcMinZ)
    for (const block of this.blocks) {
      block.y = this.height - block.top
    }
  }

  private resetField() {
    for (const block of this.blocks) {
      block.isVisible = true
      block.isActive = true
    }
  }

  private resetBall() {
    this.ball.dx = 0
    this.ball.dy = 0
  }

  private updatePlayerInput(dt: number) {
    const launch = this.updateTouch() || this.mouse.leftButtonJustReleased
    // taps also emit mouse events, ignore the mouse once touch is used
    const dx = this.isTouch ? this.touchDx : this.mouse.dxNormalized * this.width

    this.paddle.speed = dx
    this.paddle.x += dx
    this.paddle.x = clamp(this.paddle.x, 0, this.width - this.paddle.width)
    this.paddle.y = 2 + this.touchZone
    if (!this.ball.dx && !this.ball.dy) {
      if (launch) {
        if (!this.isTouch) {
          ;(this.mouse.provider as MouseListener).lock()
        }
        // launch the ball on mouse click or when the finger is lifted
        this.ball.dx = 0
        this.ball.dy = 1
        this.streak = 0
        this.score = 0
      } else {
        // stick to paddle if not launched
        this.ball.y = this.paddle.y + this.paddle.height
        this.ball.x = this.paddle.x + (this.paddle.width - this.ball.width) / 2
      }
    } else {
      // a taller field is crossed in the same time as the 16:9 baseline
      const speed = 20 * (this.height / this.minHeight)
      this.ball.x += this.ball.dx * speed * dt
      this.ball.y += this.ball.dy * speed * dt
    }
  }

  private touchDx = 0

  /**
   * Moves the paddle by the horizontal finger movement, so the finger can be anywhere.
   * Returns `true` when the finger was lifted
   */
  private updateTouch(): boolean {
    const touch: Touch | undefined = this.touch.touches.values().next().value
    const last = this.lastTouch
    this.lastTouch = touch ?? null
    this.touchDx = 0
    if (touch) {
      this.isTouch = true
      if (last?.identifier === touch.identifier) {
        const canvas = this.device.canvas as HTMLCanvasElement
        this.touchDx = ((touch.clientX - last.clientX) / canvas.clientWidth) * this.width
      }
    }
    return !!last && !touch
  }

  private updateBallCollision() {
    const ball = this.ball
    const paddle = this.paddle
    if (!ball.dx && !ball.dy) {
      return
    }

    // check walls collision
    if (rectGetY(ball, 1.0) >= this.height && ball.dy > 0) {
      ball.dy = -Math.abs(ball.dy)
      this.onBallHit()
      return
    }
    if (ball.x < 0 && ball.dx < 0) {
      ball.dx = Math.abs(ball.dx)
      this.onBallHit()
      return
    }
    if (rectGetX(ball, 1.0) >= this.width && ball.dx > 0) {
      ball.dx = -Math.abs(ball.dx)
      this.onBallHit()
      return
    }

    // paddle collision
    if (ball.dy < 0 && getCircleRectHit(ball, paddle)) {
      const oldDx = ball.dx
      const oldDy = ball.dy

      ball.dy = Math.abs(ball.dy)
      ball.dx = paddle.speed - (rectGetX(paddle, 0.5) - rectGetX(ball, 0.5)) / paddle.width
      ball.dx = clamp(ball.dx, -3, 3)

      if (Math.sign(oldDx) !== Math.sign(ball.dx) || Math.sign(oldDy) !== Math.sign(ball.dy)) {
        this.addScore(this.streak > 1 ? this.streak : 0)
        this.streak = 0
        this.onBallHit()
      }
      return
    }

    // blocks collision
    for (const block of this.blocks) {
      if (!block.isVisible) {
        continue
      }
      const hit = getCircleRectHit(ball, block)
      if (!hit) {
        continue
      }
      if (block.isActive) {
        block.isActive = false
        block.isVisible = false
        this.emit(rectGetX(block, 0.5), rectGetY(block, 0.5), 12, block.shard, 12)
      }
      this.streak += 1
      this.addScore(block.points)
      this.reflectBall(ball, hit)
      break
    }
  }

  private reflectBall(ball: GameBlock, axis: HitAxis) {
    const oldDx = ball.dx
    const oldDy = ball.dy

    if (axis === 'x') {
      ball.dx = -ball.dx
    } else {
      ball.dy = -ball.dy
    }

    if (Math.sign(oldDx) !== Math.sign(ball.dx) || Math.sign(oldDy) !== Math.sign(ball.dy)) {
      this.onBallHit()
    }
  }

  private checkWinOrLooseCondition() {
    let isCleared = true
    for (const block of this.blocks) {
      if (block.isActive) {
        isCleared = false
        break
      }
    }
    if (isCleared) {
      this.state = 'win'
    } else if (rectGetY(this.ball, 1) < this.paddle.y - 1) {
      this.state = 'loose'
    }
  }

  private addScore(points: number) {
    if (points > 0) {
      this.score += points
      this.scoreChangedAt = this.time
    }
  }

  /**
   * Plays a sound and sprays a few stars where the ball is
   */
  private onBallHit() {
    const buffer = this.sounds[Math.floor(Math.random() * this.sounds.length)]
    this.audio.playOneShot(buffer)
    this.emit(rectGetX(this.ball, 0.5), rectGetY(this.ball, 0.5), 4, 'particleSmallStar', 8)
  }

  /**
   * Spawns particles in random directions. Dead particles are reused
   */
  private emit(x: number, y: number, count: number, sprite: string, speed: number) {
    for (let i = 0; i < count; i++) {
      let p = this.particles.find((it) => it.life <= 0)
      if (!p) {
        p = { x: 0, y: 0, dx: 0, dy: 0, life: 0, maxLife: 0, size: 0, angle: 0, spin: 0, sprite }
        this.particles.push(p)
      }
      const angle = Math.random() * Math.PI * 2
      const v = speed * (0.5 + Math.random() * 0.5)
      p.x = x
      p.y = y
      p.dx = Math.cos(angle) * v
      p.dy = Math.sin(angle) * v
      p.maxLife = p.life = 0.4 + Math.random() * 0.4
      p.size = 0.4 + Math.random() * 0.4
      p.angle = angle
      p.spin = (Math.random() - 0.5) * 20
      p.sprite = sprite
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      if (p.life > 0) {
        p.life -= dt
        p.dy -= 30 * dt
        p.x += p.dx * dt
        p.y += p.dy * dt
        p.angle += p.spin * dt
      }
    }
  }

  public override onDraw(time: number, dt: number): void {
    const pass = this.device.renderPass
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    pass.setRenderBlend(0, BlendState.Alpha)

    const batch = this.spriteBatch
    batch.begin(SpriteMode.Deferred, this.projection)

    if (this.isTouch) {
      // shows where to put the finger
      this.drawSprite('buttonDefault_mid', 0, this.touchZone, this.width, this.touchZone)?.alpha(0.2)
    }

    this.drawSprite(this.ball.sprite, this.ball.x, this.ball.y, this.ball.width, this.ball.height)
    this.drawSprite(this.paddle.sprite, this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height)
    for (const block of this.blocks) {
      if (block.isVisible) {
        this.drawSprite(block.sprite, block.x, block.y, block.width, block.height)
      }
    }

    for (const p of this.particles) {
      if (p.life > 0) {
        this.drawSprite(p.sprite, p.x - p.size / 2, p.y + p.size / 2, p.size, p.size)
          ?.rotate(p.angle)
          .alpha(p.life / p.maxLife)
      }
    }

    let offset = this.drawNumber(String(this.score), 0, time)
    if (this.streak > 1) {
      offset = this.drawNumber(`+${this.streak}`, offset, time)
    }

    batch.render(pass)
    pass.flush()
  }

  /**
   * Draws the digits at the top edge. After a score change each digit bounces, one after the other
   */
  private drawNumber(text: string, offset: number, time: number) {
    const char = 2
    for (let i = 0; i < text.length; i++) {
      const t = clamp((time - this.scoreChangedAt - i * 0.04) / 0.3, 0, 1)
      const size = char * (1 + 0.5 * Math.sin(t * Math.PI))
      // grow around the center of the digit
      const name = text[i] === '+' ? 'hud_plus' : `hud_number_${text[i]}`
      this.drawSprite(name, offset + (char - size) / 2, this.height - (char - size) / 2, size, size)
      offset += char * 0.5
    }
    return offset
  }

  private drawSprite(name: string, x: number, y: number, w: number, h: number) {
    const sprite = this.sprites.get(name)
    return sprite && this.spriteBatch.next(sprite.texture!, sprite.source).destination(x, y, w, -h)
  }
}

function gameBlock(state: Partial<GameBlock>): GameBlock {
  return {
    type: 'block',
    x: 0,
    y: 0,
    top: 0,
    width: 1,
    height: 1,
    isVisible: true,
    isActive: true,
    dx: 0,
    dy: 0,
    sprite: null!,
    shard: null!,
    speed: 0,
    points: 0,
    ...state,
  }
}

interface GameBlock {
  type: 'block' | 'paddle' | 'ball'
  x: number
  y: number
  /**
   * Distance from the top edge of the field
   */
  top: number
  width: number
  height: number
  sprite: string
  /**
   * The particle sprite when the block breaks
   */
  shard: string
  isVisible: boolean
  isActive: boolean
  dx: number
  dy: number
  speed: number
  points: number
}

interface Particle {
  x: number
  y: number
  dx: number
  dy: number
  life: number
  maxLife: number
  size: number
  angle: number
  spin: number
  sprite: string
}

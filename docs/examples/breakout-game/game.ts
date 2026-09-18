import { ContentLoader } from '@gglib/content'
import { Game, MouseInput, MouseListener, TouchPane } from '@gglib/game'
import { BlendState, Color, PlatformId, SpriteBatch, SpriteMode, Texture } from '@gglib/graphics'
import { clamp, IRect, Mat4, Rect } from '@gglib/math'
import { mountUi } from 'tweak-ui'
import { getCircleRectHit, HitAxis } from './collision'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new BreakoutGame({ canvas, platform, autosize: true })
  game.run()

  mountUi(tools, (ui) => {
    ui.bool(game.loop, 'useFixedTimeStep', {
      label: 'Fixed time step',
    })
  })
  return () => {
    game.stop()
  }
}

class BreakoutGame extends Game {
  // The width and height in units.
  // Weird numbers, but fit into 16/9 aspect ratio
  public readonly width = 48
  public readonly height = 27

  public state: 'started' | 'reset' | 'running' | 'win' | 'loose' = 'started'
  public background!: Texture
  public sprites: Map<string, { texture: Texture; source: IRect }> = new Map()

  public content!: ContentLoader
  public mouse!: MouseInput
  public spriteBatch!: SpriteBatch
  public projection!: Mat4

  public ball!: GameBlock
  public paddle!: GameBlock
  public blocks!: GameBlock[]
  public audio!: AudioContext
  public sounds: AudioBuffer[] = []
  public score: number = 0
  public streak: number = 0

  public override onCreate(): void {
    this.content = new ContentLoader(this.device)
    this.mouse = new MouseInput({
      provider: new MouseListener({
        captureTarget: this.device.canvas as HTMLElement,
        eventTarget: this.device.canvas,
        preventDefault: true,
      }),
    })
    this.audio = new AudioContext()
  }

  public override onInitialize() {
    this.spriteBatch = new SpriteBatch(this.device)
    this.projection = Mat4.createOrthographicOffCenter(0, this.width, 0, this.height, 0, 100, this.device.ndcMinZ)
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
        let sprite = 'element_blue_rectangle'
        if (y >= 1) {
          points = 3
          sprite = 'element_green_rectangle'
        }
        if (y >= 3) {
          points = 5
          sprite = 'element_purple_rectangle'
        }
        if (y >= 5) {
          points = 7
          sprite = 'element_red_rectangle'
        }
        this.blocks.push(
          gameBlock({
            type: 'block',
            x: pad + x * width,
            y: 10 + y * 2,
            width: width,
            height: 1,
            sprite,
            points,
          }),
        )
      }
    }
  }

  override async onLoadContent() {
    this.background = await this.content.loadTexture('/textures/backgrounds/colored_castle.png')
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
      ].map(async (url) => {
        return fetch(url)
          .then((res) => res.arrayBuffer())
          .then((res) => {
            return this.audio.decodeAudioData(res)
          })
      }),
    )
  }

  public override onUpdate(time: number, dt: number) {
    this.mouse.update()
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
      case 'loose':
        this.state = 'reset'
        break
      default:
        this.state = 'started'
        break
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
    const mouse = this.mouse
    this.paddle.speed = mouse.dxNormalized * this.width
    this.paddle.x += this.paddle.speed
    this.paddle.x = clamp(this.paddle.x, 0, this.width - this.paddle.width)
    this.paddle.y = 2
    if (!this.ball.dx && !this.ball.dy) {
      if (mouse.leftButtonJustReleased) {
        ;(mouse.provider as MouseListener).lock()
        // launch the ball on mouse click
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
      this.ball.x += this.ball.dx * 20 * dt
      this.ball.y += this.ball.dy * 20 * dt
    }
  }

  private updateBallCollision() {
    const ball = this.ball
    const paddle = this.paddle
    if (!ball.dx && !ball.dy) {
      return
    }

    // check walls collision
    if (Rect.endY(ball) >= this.height && ball.dy > 0) {
      ball.dy = -Math.abs(ball.dy)
      this.playCollisionSound()
      return
    }
    if (ball.x < 0 && ball.dx < 0) {
      ball.dx = Math.abs(ball.dx)
      this.playCollisionSound()
      return
    }
    if (Rect.endX(ball) >= this.width && ball.dx > 0) {
      ball.dx = -Math.abs(ball.dx)
      this.playCollisionSound()
      return
    }

    // paddle collision
    if (ball.dy < 0 && getCircleRectHit(ball, paddle)) {
      const oldDx = ball.dx
      const oldDy = ball.dy

      ball.dy = Math.abs(ball.dy)
      ball.dx = paddle.speed - (Rect.centerX(paddle) - Rect.centerX(ball)) / paddle.width
      ball.dx = clamp(ball.dx, -3, 3)

      if (Math.sign(oldDx) !== Math.sign(ball.dx) || Math.sign(oldDy) !== Math.sign(ball.dy)) {
        this.score += this.streak > 1 ? this.streak : 0
        this.streak = 0
        this.playCollisionSound()
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
      }
      this.streak += 1
      this.score += block.points
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
      this.playCollisionSound()
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
    } else if (Rect.endY(this.ball) < 0) {
      this.state = 'loose'
    }
  }

  private playCollisionSound() {
    const buffer = this.sounds[Math.floor(Math.random() * (this.sounds.length - 1))]
    const node = this.audio.createBufferSource()
    node.buffer = buffer
    node.connect(this.audio.destination)
    node.start()
  }

  public override onDraw(time: number, dt: number): void {
    const pass = this.device.renderPass
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    pass.setRenderBlend(0, BlendState.Alpha)

    const batch = this.spriteBatch
    batch.begin(SpriteMode.Deferred, this.projection)
    batch.next(this.background).destination(0, this.height, this.width, -this.height)

    this.drawSprite(this.ball.sprite, this.ball.x, this.ball.y, this.ball.width, this.ball.height)
    this.drawSprite(this.paddle.sprite, this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height)
    for (const block of this.blocks) {
      if (block.isVisible) {
        this.drawSprite(block.sprite, block.x, block.y, block.width, block.height)
      }
    }

    const score = String(this.score)
    let offset = 0
    const char = 2
    for (let i = 0; i < score.length; i++) {
      this.drawSprite(`hud_number_${score.charAt(i)}`, offset, this.height, char, char)
      offset += char * 0.5
    }

    if (this.streak > 1) {
      this.drawSprite(`hud_plus`, offset, this.height, char, char)
      offset += char * 0.5

      const score = String(this.streak)
      for (let i = 0; i < score.length; i++) {
        this.drawSprite(`hud_number_${score.charAt(i)}`, offset, this.height, char, char)
        offset += char * 0.5
      }
    }

    batch.render(pass)
    pass.flush()
  }

  private drawSprite(name: string, x: number, y: number, w: number, h: number) {
    let sprite = this.sprites.get(name)
    if (sprite) {
      this.spriteBatch.next(sprite.texture!, sprite.source).destination(x, y, w, -h)
    }
  }
}

function gameBlock(state: Partial<GameBlock>): GameBlock {
  return {
    type: 'block',
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    isVisible: true,
    isActive: true,
    dx: 0,
    dy: 0,
    sprite: null!,
    speed: 0,
    points: 0,
    ...state,
  }
}

interface GameBlock {
  type: 'block' | 'paddle' | 'ball'
  x: number
  y: number
  width: number
  height: number
  sprite: string
  isVisible: boolean
  isActive: boolean
  dx: number
  dy: number
  speed: number
  points: number
}

import { ContentLoader } from '@gglib/content'
import { Game, MouseInput, MouseListener } from '@gglib/game'
import { BlendState, Color, PlatformId, SpriteBatch, SpriteMode, Texture } from '@gglib/graphics'
import { clamp, IRect, Mat4 } from '@gglib/math'

export default (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const game = new DemoGame({ canvas, platform, autosize: true })
  game.run()
  return () => {
    game.stop()
  }
}

interface SpriteSheet {
  texture: string
  sprites: Record<string, IRect>
}

const SPRITES = {
  mouse: 'mouse',
  mouse_horizontal: 'mouse_horizontal',
  mouse_left: 'mouse_left',
  mouse_left_outline: 'mouse_left_outline',
  mouse_move: 'mouse_move',
  mouse_outline: 'mouse_outline',
  mouse_right: 'mouse_right',
  mouse_right_outline: 'mouse_right_outline',
  mouse_scroll: 'mouse_scroll',
  mouse_scroll_down: 'mouse_scroll_down',
  mouse_scroll_down_outline: 'mouse_scroll_down_outline',
  mouse_scroll_outline: 'mouse_scroll_outline',
  mouse_scroll_up: 'mouse_scroll_up',
  mouse_scroll_up_outline: 'mouse_scroll_up_outline',
  mouse_scroll_vertical: 'mouse_scroll_vertical',
  mouse_scroll_vertical_outline: 'mouse_scroll_vertical_outline',
  mouse_small: 'mouse_small',
  mouse_vertical: 'mouse_vertical',
}

class DemoGame extends Game {
  public sprites: Map<string, { texture: Texture; source: IRect }> = new Map()

  public content!: ContentLoader
  public mouse!: MouseInput
  public spriteBatch!: SpriteBatch
  public projection = Mat4.createIdentity()
  private active: string[] = []
  private scale = 1

  public override onCreate(): void {
    this.content = new ContentLoader(this.device)
    this.mouse = new MouseInput({
      provider: new MouseListener({
        captureTarget: this.device.canvas as HTMLElement,
        eventTarget: this.device.canvas,
        preventDefault: true,
      }),
    })
  }

  public override onInitialize() {
    this.spriteBatch = new SpriteBatch(this.device)
    this.loop.useFixedTimeStep = false
  }

  override async onLoadContent() {
    const spritesheet = await this.content.loadTexture('/sprites/keyboard.png')
    await this.content
      .fetch<SpriteSheet>('/sprites/keyboard.sheet.json', {
        responseType: 'json',
      })
      .then((it) => {
        for (const key in it.body!.sprites) {
          // sprites are defined with bottom left image origin
          // we map them into top left origin
          const rect = it.body!.sprites[key]
          this.sprites.set(key, {
            texture: spritesheet,
            source: {
              ...rect,
              y: spritesheet.height - rect.y - rect.height,
            },
          })
        }
      })
  }

  public override onUpdate(time: number, dt: number) {
    // create a projection with top left origin, so it matches mouse coordinates
    this.projection.initOrthographicOffCenter(
      0, // left
      this.device.output.width, // right
      this.device.output.height, // bottom
      0, // top
      0, // near
      1, // far
      this.device.ndcMinZ,
    )
    this.mouse.update()
    this.active.length = 0
    if (this.mouse.wheelDelta > 0) {
      // wheel down
      this.scale -= 0.1
    }
    if (this.mouse.wheelDelta < 0) {
      // wheel up
      this.scale += 0.1
    }
    this.scale = clamp(this.scale, 0.1, 2)
  }

  public override onDraw(time: number, dt: number): void {
    const pass = this.device.renderPass
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    pass.setRenderBlend(0, BlendState.Alpha)

    let key = SPRITES.mouse
    if (this.mouse.leftButtonIsPressed) {
      key = SPRITES.mouse_left
    }
    if (this.mouse.middleButtonIsPressed) {
      key = SPRITES.mouse_scroll
    }
    if (this.mouse.rightButtonIsPressed) {
      key = SPRITES.mouse_right
    }
    const sprite = this.sprites.get(key)!

    const batch = this.spriteBatch
    batch.begin(SpriteMode.Deferred, this.projection)
    batch
      .next(sprite.texture)
      .source(sprite.source.x, sprite.source.y, sprite.source.width, sprite.source.height, false, false)
      .destination(
        this.mouse.xNormalized * this.device.output.width - 0.5 * sprite.source.width * this.scale,
        this.mouse.yNormalized * this.device.output.height - 0.5 * sprite.source.height * this.scale,
        sprite.source.width * this.scale,
        sprite.source.height * this.scale,
      )

    batch.render(pass)

    pass.flush()
  }
}

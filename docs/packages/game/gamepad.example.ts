import { ContentLoader } from '@gglib/content'
import { Game, Gamepad, GamepadButton } from '@gglib/game'
import { BlendState, Color, PlatformId, SpriteBatch, SpriteMode, Texture } from '@gglib/graphics'
import { IRect, Mat4 } from '@gglib/math'

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

const SPRITES: Record<string, [string, string]> = {
  [GamepadButton.A]: ['xbox_button_a_outline', 'xbox_button_a'],
  [GamepadButton.B]: ['xbox_button_b_outline', 'xbox_button_b'],
  [GamepadButton.X]: ['xbox_button_x_outline', 'xbox_button_x'],
  [GamepadButton.Y]: ['xbox_button_y_outline', 'xbox_button_y'],

  [GamepadButton.DPadLeft]: ['xbox_dpad_none', 'xbox_dpad_left_outline'],
  [GamepadButton.DPadRight]: ['xbox_dpad_none', 'xbox_dpad_right_outline'],
  [GamepadButton.DPadUp]: ['xbox_dpad_none', 'xbox_dpad_up_outline'],
  [GamepadButton.DPadDown]: ['xbox_dpad_none', 'xbox_dpad_down_outline'],

  [GamepadButton.LeftTrigger]: ['xbox_lt_outline', 'xbox_lt'],
  [GamepadButton.LeftShoulder]: ['xbox_lb_outline', 'xbox_lb'],
  [GamepadButton.RightShoulder]: ['xbox_rb_outline', 'xbox_rb'],
  [GamepadButton.RightTrigger]: ['xbox_rt_outline', 'xbox_rt'],

  [GamepadButton.LeftStick]: ['xbox_stick_l', 'xbox_stick_l_press'],
  [GamepadButton.Back]: ['xbox_button_back_outline', 'xbox_button_back'],
  [GamepadButton.Start]: ['xbox_button_start_outline', 'xbox_button_start'],
  [GamepadButton.RightStick]: ['xbox_stick_r', 'xbox_stick_r_press'],

  [GamepadButton.Extra1]: ['xbox_button_share_outline', 'xbox_button_share'],
  [GamepadButton.Extra2]: ['xbox_button_share_outline', 'xbox_button_share'],
  [GamepadButton.Extra3]: ['xbox_button_share_outline', 'xbox_button_share'],
  [GamepadButton.Extra4]: ['xbox_button_share_outline', 'xbox_button_share'],
  [GamepadButton.Extra5]: ['xbox_button_share_outline', 'xbox_button_share'],
  [GamepadButton.Extra6]: ['xbox_button_share_outline', 'xbox_button_share'],
  [GamepadButton.Extra7]: ['xbox_button_share_outline', 'xbox_button_share'],
  [GamepadButton.Extra8]: ['xbox_button_share_outline', 'xbox_button_share'],
  [GamepadButton.Extra9]: ['xbox_button_share_outline', 'xbox_button_share'],
}

class DemoGame extends Game {
  public content!: ContentLoader
  public gamepad!: Gamepad

  public spriteBatch!: SpriteBatch
  public projection = Mat4.createIdentity()

  private texture!: Texture
  private sprites: Record<string, IRect> = {}

  public override onCreate(): void {
    this.content = new ContentLoader(this.device)
    this.gamepad = new Gamepad({})
  }

  public override onInitialize() {
    this.spriteBatch = new SpriteBatch(this.device)
    this.loop.useFixedTimeStep = false
  }

  override async onLoadContent() {
    this.texture = await this.content.loadTexture('/sprites/controller.png')
    this.sprites = await this.content
      .fetch<SpriteSheet>('/sprites/controller.sheet.json', {
        responseType: 'json',
      })
      .then((it) => it.body?.sprites!)
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
    this.gamepad.update()
  }

  public override onDraw(time: number, dt: number): void {
    const pass = this.device.renderPass
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    pass.setRenderBlend(0, BlendState.Alpha)

    const max = 4
    let col = 0
    let row = 0

    const batch = this.spriteBatch
    batch.begin(SpriteMode.Deferred, this.projection)

    const connected = this.gamepad.isConnected(1)
    for (const key in SPRITES) {
      const spriteKey = SPRITES[key][this.gamepad.isPressed(1, Number(key) as GamepadButton) ? 1 : 0]
      this.drawSprite(spriteKey, row, col, connected ? 1 : 0.5)
      col++
      if (col >= max) {
        col = 0
        row++
      }
    }

    batch.render(pass)

    pass.flush()
  }

  private drawSprite(spriteKey: string, row: number, col: number, alpha: number) {
    const size = 64
    const rect = this.sprites[spriteKey]
    this.spriteBatch
      .next(this.texture)
      .source(
        rect.x,
        // sprites are defined with bottom left image origin
        // we map them into top left origin
        this.texture.height - rect.y - rect.height,
        rect.width,
        rect.height,
      )
      .destination(col * size, row * size, size, size)
      .alpha(alpha)
  }
}

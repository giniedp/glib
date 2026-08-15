import { ContentLoader } from '@gglib/content'
import { Game, Keyboard, KeyboardKeys } from '@gglib/game'
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
  [KeyboardKeys.Digit0]: ['keyboard_0_outline', 'keyboard_0'],
  [KeyboardKeys.Digit1]: ['keyboard_1_outline', 'keyboard_1'],
  [KeyboardKeys.Digit2]: ['keyboard_2_outline', 'keyboard_2'],
  [KeyboardKeys.Digit3]: ['keyboard_3_outline', 'keyboard_3'],
  [KeyboardKeys.Digit4]: ['keyboard_4_outline', 'keyboard_4'],
  [KeyboardKeys.Digit5]: ['keyboard_5_outline', 'keyboard_5'],
  [KeyboardKeys.Digit6]: ['keyboard_6_outline', 'keyboard_6'],
  [KeyboardKeys.Digit7]: ['keyboard_7_outline', 'keyboard_7'],
  [KeyboardKeys.Digit8]: ['keyboard_8_outline', 'keyboard_8'],
  [KeyboardKeys.Digit9]: ['keyboard_9_outline', 'keyboard_9'],

  [KeyboardKeys.KeyQ]: ['keyboard_q_outline', 'keyboard_q'],
  [KeyboardKeys.KeyW]: ['keyboard_w_outline', 'keyboard_w'],
  [KeyboardKeys.KeyE]: ['keyboard_e_outline', 'keyboard_e'],
  [KeyboardKeys.KeyR]: ['keyboard_r_outline', 'keyboard_r'],
  [KeyboardKeys.KeyT]: ['keyboard_t_outline', 'keyboard_t'],
  [KeyboardKeys.KeyY]: ['keyboard_y_outline', 'keyboard_y'],
  [KeyboardKeys.KeyU]: ['keyboard_u_outline', 'keyboard_u'],
  [KeyboardKeys.KeyI]: ['keyboard_i_outline', 'keyboard_i'],
  [KeyboardKeys.KeyO]: ['keyboard_o_outline', 'keyboard_o'],
  [KeyboardKeys.KeyP]: ['keyboard_p_outline', 'keyboard_p'],

  [KeyboardKeys.KeyA]: ['keyboard_a_outline', 'keyboard_a'],
  [KeyboardKeys.KeyS]: ['keyboard_s_outline', 'keyboard_s'],
  [KeyboardKeys.KeyD]: ['keyboard_d_outline', 'keyboard_d'],
  [KeyboardKeys.KeyF]: ['keyboard_f_outline', 'keyboard_f'],
  [KeyboardKeys.KeyG]: ['keyboard_g_outline', 'keyboard_g'],
  [KeyboardKeys.KeyH]: ['keyboard_h_outline', 'keyboard_h'],
  [KeyboardKeys.KeyJ]: ['keyboard_j_outline', 'keyboard_j'],
  [KeyboardKeys.KeyK]: ['keyboard_k_outline', 'keyboard_k'],
  [KeyboardKeys.KeyL]: ['keyboard_l_outline', 'keyboard_l'],
  [KeyboardKeys.Semicolon]: ['keyboard_semicolon_outline', 'keyboard_semicolon'],

  [KeyboardKeys.KeyZ]: ['keyboard_z_outline', 'keyboard_z'],
  [KeyboardKeys.KeyX]: ['keyboard_x_outline', 'keyboard_x'],
  [KeyboardKeys.KeyC]: ['keyboard_c_outline', 'keyboard_c'],
  [KeyboardKeys.KeyV]: ['keyboard_v_outline', 'keyboard_v'],
  [KeyboardKeys.KeyB]: ['keyboard_b_outline', 'keyboard_b'],
  [KeyboardKeys.KeyN]: ['keyboard_n_outline', 'keyboard_n'],
  [KeyboardKeys.KeyM]: ['keyboard_m_outline', 'keyboard_m'],
}

class DemoGame extends Game {
  public content!: ContentLoader
  public keyboard!: Keyboard

  public spriteBatch!: SpriteBatch
  public projection = Mat4.createIdentity()

  private texture!: Texture
  private sprites: Record<string, IRect> = {}

  public override onCreate(): void {
    this.content = new ContentLoader(this.device)
    this.keyboard = new Keyboard({})
  }

  public override onInitialize() {
    this.spriteBatch = new SpriteBatch(this.device)
    this.loop.useFixedTimeStep = false
  }

  override async onLoadContent() {
    this.texture = await this.content.loadTexture('/sprites/keyboard.png')
    this.sprites = await this.content
      .fetch<SpriteSheet>('/sprites/keyboard.sheet.json', {
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
    this.keyboard.update()
  }

  public override onDraw(time: number, dt: number): void {
    const pass = this.device.renderPass
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    pass.setRenderBlend(0, BlendState.Alpha)

    const max = 10
    let col = 0
    let row = 0

    const batch = this.spriteBatch
    batch.begin(SpriteMode.Deferred, this.projection)

    for (const key in SPRITES) {
      const spriteKey = SPRITES[key][this.keyboard.isPressed(key) ? 1 : 0]
      this.drawSprite(spriteKey, row, col)
      col++
      if (col >= max) {
        col = 0
        row++
      }
    }

    batch.render(pass)

    pass.flush()
  }

  private drawSprite(spriteKey: string, row: number, col: number) {
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
  }
}

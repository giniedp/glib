import { glsl } from '@gglib/effects'
import { createShaderEffect, Device, ShaderEffect } from '@gglib/graphics'
import { Manager } from '../Manager'
import { Stage } from '../Types'

export interface PixelateOptions {
  enabled?: boolean
  pixelWidth?: number
  pixelHeight?: number
  offset?: number
}

function getOption<T, K>(options: K, option: keyof K, fallback: T): T {
  if (option in options) {
    return options[option] as any
  }
  return fallback
}

/**
 * @public
 */
export class PostPixelate implements Stage {
  public get ready() {
    return this.effect != null
  }

  public enabled = true
  public pixelWidth: number = 10
  public pixelHeight: number = 10
  public offset: number = 0
  private effect: ShaderEffect

  constructor(private device: Device, options: PixelateOptions = {}) {
    this.pixelWidth = getOption(options, 'pixelWidth', this.pixelWidth)
    this.pixelHeight = getOption(options, 'pixelHeight', this.pixelHeight)
    this.enabled = getOption(options, 'enabled', this.enabled)
    this.offset = getOption(options, 'offset', this.offset)
    this.createEffect()
  }

  private async createEffect() {
    this.effect = await createShaderEffect(this.device, SHADER)
  }

  public render(manager: Manager) {
    if (!this.ready || !this.enabled) {
      return
    }

    let rt = manager.beginStep()
    let rt2 = manager.acquireTarget(rt)

    let program = this.effect.getTechnique(0).pass(0).program
    program.setUniform('texture', rt)
    program.setUniform('vOffset', this.offset)
    program.setUniform('pixelWidth', this.pixelWidth)
    program.setUniform('pixelHeight', this.pixelHeight)
    program.setUniform('targetWidth', rt.width)
    program.setUniform('targetHeight', rt.height)

    manager.device.setRenderTarget(rt2)
    manager.device.program = program
    manager.device.drawQuad(false)
    manager.device.setRenderTarget(null)

    manager.endStep(rt2)
  }
}

const SHADER = {
  name: 'Pixelate',
  program: glsl`
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 position;

    // @binding texture
    attribute vec2 texture;

    // @binding texture
    uniform sampler2D textureSampler;

    // @binding targetWidth
    uniform float targetWidth;

    // @binding targetHeight
    uniform float targetHeight;

    varying vec2 texCoord;

    // @default 0
    uniform float vOffset;

    // @default 4
    uniform float pixelWidth;

    // @default 4
    uniform float pixelHeight;
  `,
  technique: {
    name: '',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          vec2 uv = texCoord;
          if (uv.x >= vOffset) {
            float dx = pixelWidth / targetWidth;
            float dy = pixelHeight / targetHeight;
            uv = vec2(dx * floor(uv.x / dx), dy * floor(uv.y / dy));
          }
          gl_FragColor = vec4(texture2D(textureSampler, uv).rgb, 1);
        }
      `,
    },
  },
}

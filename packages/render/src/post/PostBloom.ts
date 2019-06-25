import { glsl } from '@gglib/effects'
import {
  BlendState,
  Color,
  createShaderEffect,
  CullState,
  DepthState,
  Device,
  ShaderEffect,
  ShaderFxDocument,
  StencilState,
} from '@gglib/graphics'

import { Manager } from '../Manager'
import { Stage } from '../Types'

function gauss(n: number, theta: number) {
  return ((1.0 / Math.sqrt(2 * Math.PI * theta)) * Math.exp(-(n * n) / (2.0 * theta * theta)))
}

/**
 * Constructor options for {@link PostBloom}
 *
 * @public
 */
export interface BloomOptions {
  enabled?: boolean
  glowCut?: number
  multiplier?: number
  gaussSigma?: number
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
export class PostBloom implements Stage {
  public get ready() {
    return this.effect != null
  }

  public enabled: boolean = true
  public glowCut: number = 0.6
  public multiplier: number = 0.83
  public gaussSigma: number = 0.5
  private offsetWeights: number[][]
  private effect: ShaderEffect

  constructor(private device: Device, options: BloomOptions = {}) {
    this.enabled = getOption(options, 'enabled', this.enabled)
    this.glowCut = getOption(options, 'glowCut', this.glowCut)
    this.multiplier = getOption(options, 'multiplier', this.multiplier)
    this.gaussSigma = getOption(options, 'gaussSigma', this.gaussSigma)
    this.createEffect()
  }

  private async createEffect() {
    this.effect = await createShaderEffect(this.device, SHADER)
  }

  private updateGauss(texelX: number, texelY: number) {
    let samples = 9
    let samplesOff = Math.floor(samples / 2)
    let offWeights = this.offsetWeights || []
    offWeights.length = samples
    offWeights.length = samples
    this.offsetWeights = offWeights
    for (let i = 0; i < samples; i++) {
        let data = offWeights[i]
        if (!data) {
          data = [0, 0, 0, 0]
          offWeights[i] = data
        }
        let off = (i - samplesOff)
        // Compute the offsets. We take 9 samples - 4 either side and one in the middle:
        //     i =  0,  1,  2,  3, 4,  5,  6,  7,  8
        // Offset = -4, -3, -2, -1, 0, +1, +2, +3, +4
        data[0] = off * texelX
        data[1] = off * texelY
        if (off !== 0) {
          // half pixel offset to get a sample between the pixels
          data[0] += (off > 0 ? 0.5 : -0.5) * texelX
          data[1] += (off > 0 ? 0.5 : -0.5) * texelY
        }
        // map to [-1:+1]
        let norm = off / samplesOff
        data[2] = this.multiplier * gauss(norm, this.gaussSigma)
        data[3] = this.multiplier * gauss(norm, this.gaussSigma)
    }
  }

  public render(manager: Manager) {
    if (!this.ready || !this.enabled) {
      return
    }

    let baseTarget = manager.beginStep()

    // DEBUG
    // manager.releaseTarget(rt2);
    // manager.endEffect(baseTarget);
    // return;

    let rt1 = manager.acquireTarget(baseTarget)
    let rt2 = manager.acquireTarget(baseTarget)

    this.updateGauss(1.0 / baseTarget.width, 1.0 / baseTarget.height)

    let device = manager.device
    device.depthState = DepthState.Default
    device.stencilState = StencilState.Default
    device.blendState = BlendState.Default
    device.cullState = CullState.CullNone

    // ------------------------------------------------
    // [1] GLOW CUT -> rt1
    //
    device.program = this.effect.getTechnique('glowCut').pass(0).program
    device.program.setUniform('texture', baseTarget)
    device.program.setUniform('threshold', this.glowCut)
    device.setRenderTarget(rt1)
    device.clear(0xFF000000, 1, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // DEBUG
    // manager.releaseTarget(rt2)
    // manager.endStep(rt1)
    // return

    // ------------------------------------------------
    // [2] HORIZONTAL BLUR -> rt2
    //
    // calculate filter offsets and weights
    device.program = this.effect.getTechnique('hBlur').pass(0).program
    device.program.setUniform('texture', rt1)
    for (let i = 0; i < this.offsetWeights.length; i++) {
      device.program.setUniform(`offsetWeights${i}`, this.offsetWeights[i])
    }
    device.setRenderTarget(rt2)
    device.clear(Color.TransparentBlack, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // DEBUG
    // manager.releaseTarget(rt2)
    // manager.endStep(rt1)
    // return

    // ------------------------------------------------
    // [2] VERTICAL BLUR -> rt1
    //
    // calculate filter offsets and weights
    device.program = this.effect.getTechnique('vBlur').pass(0).program
    device.program.setUniform('texture', rt2)
    for (let i = 0; i < this.offsetWeights.length; i++) {
      device.program.setUniform(`offsetWeights${i}`, this.offsetWeights[i])
    }
    device.setRenderTarget(rt1)
    device.clear(Color.TransparentBlack, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // DEBUG
    // manager.releaseTarget(rt2)
    // manager.endStep(rt1)
    // return

    // ------------------------------------------------
    // [4] COMBINE BOOM -> pongTrarget
    //
    device.program = this.effect.getTechnique('combine').pass(0).program
    device.program.setUniform('texture', baseTarget)
    device.program.setUniform('bloomTexture', rt1)

    device.setRenderTarget(rt2)
    device.clear(Color.TransparentBlack, 1)
    device.drawQuad(false)
    device.setRenderTarget(null)

    manager.releaseTarget(rt1)
    manager.endStep(rt2)
  }
}

const SHADER: ShaderFxDocument = {
  name: 'bloom',
  program: glsl`
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 position;

    // @binding texture
    attribute vec2 texture;

    varying vec2 texCoord;

    // @default 0.75
    uniform float threshold;

    // x -> offset horizontal
    // y -> offset vertical
    // z -> weight horizontal
    // w -> weight vertical
    uniform vec4 offsetWeights[9];

    // @binding texture
    // @register 0
    uniform sampler2D textureSampler;
    // @binding bloomTexture
    // @register 1
    uniform sampler2D bloomSampler;

    vec4 glowCut(vec2 uv) {
      vec3 color = texture2D(textureSampler, uv).rgb;
      float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (luminance > threshold) {
        return vec4(color.rgb, 1.0);
      }
      return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 hBlur(vec2 uv) {
      vec4 color = vec4(0);
      for( int i = 0; i < 9; i++ ) {
          color += texture2D(textureSampler, uv + vec2(offsetWeights[i].x, 0.0)) * offsetWeights[i].z;
      }
      return vec4(color.rgb, 1.0);
    }

    vec4 vBlur(vec2 uv) {
      vec4 color = vec4(0);
      for( int i = 0; i < 9; i++ ) {
          color += texture2D(textureSampler, uv + vec2(0.0, offsetWeights[i].y)) * offsetWeights[i].w;
      }
      return vec4(color.rgb, 1.0);
    }


    vec4 combine(vec2 uv) {
      vec3 base = texture2D(textureSampler, uv).rgb;
      vec3 bloom = texture2D(bloomSampler, uv).rgb * 0.5;

      base *= (1.0 - clamp(bloom, vec3(0), vec3(1)));

      return vec4((base + bloom).rgb, 1.0);
    }
  `,

  technique: [{
    name: 'glowCut',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          gl_FragColor = glowCut(texCoord);
        }
      `,
    },
  }, {
    name: 'hBlur',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          gl_FragColor = hBlur(texCoord);
        }
      `,
    },
  }, {
    name: 'vBlur',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          gl_FragColor = vBlur(texCoord);
        }
      `,
    },
  }, {
    name: 'combine',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          gl_FragColor = combine(texCoord);
        }
      `,
    },
  }],
}

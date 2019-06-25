// tslint:disable no-bitwise
import { glsl } from '@gglib/effects'
import { BlendState, createShaderEffect, DepthFormat, Device, ShaderEffect, ShaderFxDocument, ShaderProgram } from '@gglib/graphics'
import { Manager } from '../Manager'
import { Stage } from '../Types'

export interface BloomKawaseOptions {
  enabled?: boolean
  glowCut?: number
  iterations?: number
  halfSize?: boolean
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
export class PostBloomKawase implements Stage {
  public get ready() {
    return this.effect != null
  }

  public enabled = true
  public glowCut: number = 0.6
  public iterations: number = 5
  public halfSize: boolean = true
  private targetOptions = {
    width: 2, height: 2, depthFormat: DepthFormat.None,
  }

  private effect: ShaderEffect

  constructor(private device: Device, options: BloomKawaseOptions = {}) {
    this.enabled = getOption(options, 'enabled', this.enabled)
    this.glowCut = getOption(options, 'glowCut', this.glowCut)
    this.iterations = getOption(options, 'iterations', this.iterations)
    this.halfSize = getOption(options, 'halfSize', this.halfSize)
    this.createEffect()
  }

  private async createEffect() {
    this.effect = await createShaderEffect(this.device, SHADER)
  }

  public render(manager: Manager) {
    if (!this.ready || !this.enabled) {
      return
    }

    let baseTarget = manager.beginStep()

    if (this.halfSize) {
      this.targetOptions.width = (baseTarget.width / 2) | 0
      this.targetOptions.height = (baseTarget.height / 2) | 0
    } else {
      this.targetOptions.width = baseTarget.width
      this.targetOptions.height = baseTarget.height
    }

    let resultTarget = manager.acquireTarget(baseTarget)
    let renderTarget1 = manager.acquireTarget(this.targetOptions)
    let renderTarget2 = manager.acquireTarget(this.targetOptions)
    let texel = renderTarget1.texel

    let device = manager.device
    let program: ShaderProgram

    // ------------------------------------------------
    // GLOW CUT
    //

    program = this.effect.getTechnique('glowCut').pass(0).program
    program.setUniform('threshold', this.glowCut)
    program.setUniform('texture1', baseTarget)
    device.program = program
    device.blendState = BlendState.Default
    device.setRenderTarget(renderTarget1)
    device.drawQuad()
    device.setRenderTarget(null)

    // DEBUG
    // manager.releaseTarget(renderTarget2);
    // manager.releaseTarget(resultTarget);
    // manager.endEffect(renderTarget1);
    // return;

    // ------------------------------------------------
    // KAWASE ITERATIONS
    //
    program = this.effect.getTechnique('kawaseIteration').pass(0).program
    device.blendState = BlendState.Default
    for (let i = 0; i < this.iterations; i++) {
      program.setUniform('iteration', i + 1)
      program.setUniform('texture1', renderTarget1)
      program.setUniform('texel', texel)
      device.program = program
      device.blendState = BlendState.Default
      device.setRenderTarget(renderTarget2)
      device.drawQuad()
      device.setRenderTarget(null)
      let temp = renderTarget1
      renderTarget1 = renderTarget2
      renderTarget2 = temp
    }

    // DEBUG
    // manager.releaseTarget(renderTarget2);
    // manager.releaseTarget(resultTarget);
    // manager.endEffect(renderTarget1);
    // return;

    // ------------------------------------------------
    // COMBINE
    //
    program = this.effect.getTechnique('combine').pass(0).program
    program.setUniform('texture1', baseTarget)
    program.setUniform('texture2', renderTarget1)
    device.program = program
    device.blendState = BlendState.Default
    device.setRenderTarget(resultTarget)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // FINISH
    manager.releaseTarget(renderTarget1)
    manager.releaseTarget(renderTarget2)
    manager.endStep(resultTarget)
  }

}

const SHADER: ShaderFxDocument = {
  name: 'bloom kawase',
  program: glsl`
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 position;
    // @binding texture
    attribute vec2 texture;
    //
    varying vec2 texCoord;

    // @default 1.0
    uniform float iteration;
    // @default 0.75
    uniform float threshold;
    // @binding texel
    uniform vec2 texel;
    // @binding texture1
    // @register 0
    uniform sampler2D texture1Sampler;
    // @binding texture2
    // @register 1
    uniform sampler2D texture2Sampler;

    vec4 glowCut(in sampler2D texture, in vec2 uv, in float threshold) {
      vec3 color = texture2D(texture, uv).rgb;
      float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (lum > threshold) {
        return vec4(color.rgb, 1.0);
      }
      return vec4(0.0, 0.0, 0.0, 1.0);
    }

    vec4 kawaseIteration(in sampler2D texture, in vec2 uv) {
      vec2 texCoord = vec2(0);
      vec2 dUV = (texel * iteration) + texel * 0.5;
      vec4 color = vec4(0);

      // Sample top left pixel
      texCoord.x= uv.x - dUV.x;
      texCoord.y= uv.y + dUV.y;
      color = texture2D(texture, texCoord);

      // Sample top right pixel
      texCoord.x= uv.x + dUV.x;
      texCoord.y= uv.y + dUV.y;
      color += texture2D(texture, texCoord);

      // Sample bottom right pixel
      texCoord.x= uv.x + dUV.x;
      texCoord.y= uv.y - dUV.y;
      color += texture2D(texture, texCoord);

      // Sample bottom left pixel
      texCoord.x= uv.x - dUV.x;
      texCoord.y= uv.y - dUV.y;
      color += texture2D(texture, texCoord);

      // Average
      color *= 0.25;
      color.a = 1.0;
      return color;
    }

    vec4 adjustSaturation(in vec4 color, in float saturation) {
      // The constants 0.299, 0.587, 0.114 are chosen because the
      // human eye is more sensitive to green light, and less to blue.
      float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      return vec4(mix(vec3(lum), color.rgb, saturation), color.a);
    }

    vec4 combine(in sampler2D texture1, in sampler2D texture2, in vec2 uv) {
      // Look up the bloom and original base image colors.
      vec4 base = texture2D(texture1, uv);
      vec4 bloom = texture2D(texture2, uv);

      // Adjust color saturation and intensity.
      bloom = adjustSaturation(bloom, 1.0) * 0.5;
      base = adjustSaturation(base, 1.0) * 1.0;

      // Darken down the base image in areas where there is a lot of bloom,
      // to prevent things looking excessively burned-out.
      base *= (1.0 - clamp(bloom, vec4(0), vec4(1)));

      // Combine the two images.
      return base + bloom;
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
          gl_FragColor = glowCut(texture1Sampler, texCoord, threshold);
        }
      `,
    },
  }, {
    name: 'kawaseIteration',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          gl_FragColor = kawaseIteration(texture1Sampler, texCoord);
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
          gl_FragColor = combine(texture1Sampler, texture2Sampler, texCoord);
        }
      `,
    },
  }],
}

import { glsl } from '@gglib/effects'
import {
  BlendState,
  createShaderEffect,
  CullState,
  DepthFormat,
  DepthState,
  Device,
  ShaderEffect,
  StencilState,
  Texture,
  TextureFilter,
  TextureWrapMode,
} from '@gglib/graphics'
import { Manager } from '../Manager'
import { Stage } from '../Types'

export interface TonemapOptions {
  enabled?: boolean
  adaptSpeed?: number
  exposure?: number
  blackPoint?: number
  whitePoint?: number
  debugTarget?: number
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
export class Tonemap implements Stage {
  public get ready() {
    return this.effect != null
  }

  public adaptSpeed: number = 0.2
  public exposure: number = 0.3
  public blackPoint: number = 0.0
  public whitePoint: number = 0.8
  public enabled: boolean = true
  public clearNext: boolean = false
  public debugTarget: number = 0

  private targets: Texture[] = []
  private targetOptions = [{
    width: 512, height: 512, depthFormat: DepthFormat.None,
  }, {
    width: 128, height: 128, depthFormat: DepthFormat.None,
  }, {
    width: 32, height: 32, depthFormat: DepthFormat.None,
  }, {
    width: 8, height: 8, depthFormat: DepthFormat.None,
  }, {
    width: 2, height: 2, depthFormat: DepthFormat.None,
  }]

  private effect: ShaderEffect

  private lum1: Texture
  private lum2: Texture
  private lumOptions = {
    width: 2, height: 2, depthFormat: DepthFormat.None,
  }

  constructor(private device: Device, options: TonemapOptions = {}) {
    this.enabled = getOption(options, 'enabled', this.enabled)
    this.adaptSpeed = getOption(options, 'adaptSpeed', this.adaptSpeed)
    this.exposure = getOption(options, 'exposure', this.exposure)
    this.blackPoint = getOption(options, 'blackPoint', this.blackPoint)
    this.whitePoint = getOption(options, 'whitePoint', this.whitePoint)
    this.debugTarget = getOption(options, 'debugTarget', this.debugTarget)
    this.createEffect()
  }

  private async createEffect() {
    this.effect = await createShaderEffect(this.device, SHADER)
  }

  public setup(manager: Manager) {
    // get luminance history buffers
    this.lum1 = manager.acquireTarget(this.lumOptions)
    this.lum2 = manager.acquireTarget(this.lumOptions)
  }

  public render(manager: Manager) {
    if (!this.ready || !this.enabled) {
      return
    }

    // TODO: implement with HdrBlendable format

    const programLuminance = this.effect.getTechnique('Luminance').pass(0).program
    const programDownsample = this.effect.getTechnique('Downsample').pass(0).program
    const programCombine = this.effect.getTechnique('Combine').pass(0).program
    const programTonemap = this.effect.getTechnique('Tonemap').pass(0).program
    const programCopy = this.effect.getTechnique('Copy').pass(0).program

    const sourceTexture = manager.beginStep()
    if (sourceTexture == null) {
      throw new Error(`Tonemap can not operate without an input texture`)
    }

    // the resulting buffer
    const targetBuffer = manager.acquireTarget({
      width: sourceTexture.width,
      height: sourceTexture.height,
      depthFormat: sourceTexture.depthFormat,
    })

    // get all intermediate downsample buffers
    for (let i = 0; i < this.targetOptions.length; i++) {
      this.targets[i] = manager.acquireTarget(this.targetOptions[i])
    }

    const device = manager.device
    device.blendState = BlendState.Default
    device.depthState = DepthState.Default
    device.stencilState = StencilState.Default
    device.cullState = CullState.CullNone
    device.samplerStates[0].commit({
      minFilter: TextureFilter.Point,
      magFilter: TextureFilter.Point,
      wrapU: TextureWrapMode.Clamp,
      wrapV: TextureWrapMode.Clamp,
    })

    //
    // clear intermediate and history buffers
    //
    if (this.clearNext) {
      this.clearNext = false
      for (const target of this.targets) {
        device.setRenderTarget(target)
        device.clearColor(0)
      }
      device.setRenderTarget(this.lum1)
      device.clearColor(0)
      device.setRenderTarget(this.lum2)
      device.clearColor(0)
    }

    // -------------------------------------------------
    // [1] DETERMINE LUMINANCE
    //
    // perform luminance downscale in 5 steps until 2x2 size is reached
    for (let i = 0; i < 5; i++) {
      let program = programLuminance
      let source = sourceTexture
      if (i > 0) {
        program = programDownsample
        source = this.targets[i - 1]
      }
      program.setUniform('texture1', source)
      program.setUniform('texture1Texel', source.texel)
      device.program = program
      device.setRenderTarget(this.targets[i])
      device.drawQuad(false)
      device.setRenderTarget(null)
    }

    // combine luminance
    let thisFrameLuminance = this.targets[this.targets.length - 1]
    let lastFrameLuminance = this.lum1
    programCombine.setUniform('texture1', thisFrameLuminance)
    programCombine.setUniform('texture1Texel', thisFrameLuminance.texel)
    programCombine.setUniform('texture2', lastFrameLuminance)
    programCombine.setUniform('adaptSpeed', this.adaptSpeed)
    device.program = programCombine
    device.setRenderTarget(this.lum2)
    device.drawQuad(false)
    device.setRenderTarget(null)

    // -------------------------------------------------
    // [2] APPLY TONEMAPPING
    //
    // maps the HDR color values to range in [0:1]

    // setup tone map effect
    programTonemap.setUniform('exposure', this.exposure)
    programTonemap.setUniform('whitePoint', this.whitePoint)
    programTonemap.setUniform('blackPoint', this.blackPoint)
    programTonemap.setUniform('texture1', sourceTexture)
    programTonemap.setUniform('texture1Texel', sourceTexture.texel)
    programTonemap.setUniform('texture2', this.lum2)
    device.program = programTonemap
    device.setRenderTarget(targetBuffer)
    device.drawQuad(false)
    device.setRenderTarget(null)

    //
    // DEBUG
    //

    let di = this.debugTarget - 1
    let debug = this.targets[di]
    if (!debug && di > 0) {
      debug = this.lum2
    }

    if (debug) {
      programCopy.setUniform('texture1', debug)
      device.program = programCopy
      device.setRenderTarget(targetBuffer)
      device.drawQuad(false)
      device.setRenderTarget(null)
    }

    // cleanup
    for (let i = 0; i < this.targetOptions.length; i++) {
      manager.releaseTarget(this.targets[i])
      this.targets[i] = null
    }

    // swap history frames
    let temp = this.lum2
    this.lum2 = this.lum1
    this.lum1 = temp

    // end effect with the 'targetBuffer'
    // causes the manager to release the 'frontBuffer'
    // and replace it with the given one
    manager.endStep(targetBuffer)
  }

  public cleanup(manager: Manager) {
    manager.releaseTarget(this.lum1)
    manager.releaseTarget(this.lum2)
  }
}

const SHADER = {
  name: 'tonemapping',
  program: glsl`
    precision highp float;
    precision highp int;

    // @binding position
    attribute vec3 position;

    // @binding texture
    attribute vec2 texture;

    varying vec2 texCoord;

    // @binding texture1
    // @register 0
    uniform sampler2D texture1Sampler;
    // @binding texture1Texel
    uniform vec2 texture1Texel;

    // @binding texture2
    // @register 1
    // @filter LinearClamp
    uniform sampler2D texture2Sampler;
    // @binding texture2Texel
    uniform vec2 texture2Texel;

    const vec3 dotLum = vec3(0.2126, 0.7152, 0.0722);

    vec4 extractLuminance(sampler2D texture, vec2 uv, vec2 texel) {
      float average = 0.0;
      float minimum = 1.0;
      float maximum = -1e20;
      vec3 color = vec3(0);
      float lum = 0.0;

      // get color and calculate luminance
      color   = texture2D(texture, uv).rgb;
      lum     = dot(color, dotLum);
      average = average + lum;
      minimum = min(minimum, lum);
      maximum = max(maximum, lum);

      color   = texture2D(texture, uv + texel).rgb;
      lum     = dot(color, dotLum);
      average = average + lum;
      minimum = min(minimum, lum);
      maximum = max(maximum, lum);

      color   = texture2D(texture, uv + vec2(texel.x, 0)).rgb;
      lum     = dot(color, dotLum);
      average = average + lum;
      minimum = min(minimum, lum);
      maximum = max(maximum, lum);

      color   = texture2D(texture, uv + vec2(0, texel.y)).rgb;
      lum     = dot(color, dotLum);
      average = average + lum;
      minimum = min(minimum, lum);
      maximum = max(maximum, lum);

      average *= 0.25;
      return vec4(average, maximum, minimum, 1);
    }

    vec4 downsample(sampler2D texture, vec2 uv, vec2 texel) {
      vec3 luminance = vec3(0);
      vec3 data = vec3(0);

      data = texture2D(texture, uv).rgb;
      luminance.r = luminance.r + data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture, uv + texel).rgb;
      luminance.r = luminance.r + data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture, uv + vec2(texel.x, 0)).rgb;
      luminance.r = luminance.r + data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture, uv + vec2(0, texel.y)).rgb;
      luminance.r = luminance.r + data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      luminance.r *= 0.25;
      return vec4(luminance.rgb, 1);
    }

    vec4 adaptLuminance(sampler2D texture1, sampler2D texture2, vec2 uv, vec2 texel, float speed) {
      vec3 luminance = vec3(0);

      vec4 data = texture2D(texture1, uv);
      luminance.r += data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture1, uv + texel);
      luminance.r += data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture1, uv + vec2(texel.x, 0));
      luminance.r += data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      data = texture2D(texture1, uv + vec2(0, texel.y));
      luminance.r += data.r;
      luminance.g = max(luminance.g, data.g);
      luminance.b = min(luminance.b, data.b);

      luminance.r *= 0.25;

      vec3 adaptedLum = texture2D(texture2, vec2(0.5, 0.5)).rgb;
      luminance = adaptedLum + (luminance - adaptedLum) * clamp(speed, 0.0, 1.0);
      return vec4(luminance.rgb, 1.0);
    }

    float mapLuminance(float intensity, float exposure, float avgLum, float black, float white) {
      // Reinhard's tone mapping equation (See Eqn#3 from  "Photographic Tone
      // Reproduction for Digital Images" for more details) is:
      //
      //      (      (   L     ))
      // L  * (1.0f +(---------))
      //      (      ((Lm * Lm)))
      // -------------------------
      //         1.0f + L
      //
      // L is the luminance at the given point, this is computed using Eqn#2
      // from the above paper:
      //
      //        exposure
      //   Lp = -------- * intensity
      //          avg
      //
      // The "exposure" ("key" in the above paper) can be used to adjust the
      // overall "balance" of the image. "avg" is the average luminance across
      // the scene, computed via the luminance downsampling process.
      // "intensity" is the measured brightness of the current pixel
      // being processed.

      float i = intensity - black;
      float Ld = 0.0;
      if (i > 0.0)
      {
          float L = exposure / avgLum * i;
          Ld = L * (1.0 + L / (white * white)) / (1.0 + L);
      }
      return Ld;
    }
  `,
  technique: [{
    name: 'Luminance',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          gl_FragColor = extractLuminance(texture1Sampler, texCoord, texture1Texel);
        }
      `,
    },
  }, {
    name: 'Downsample',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        void main() {
          gl_FragColor = downsample(texture1Sampler, texCoord, texture1Texel);
        }
      `,
    },
  }, {
    name: 'Combine',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        // @default 0.2
        uniform float adaptSpeed;

        void main() {
          gl_FragColor = adaptLuminance(texture1Sampler, texture2Sampler, texCoord, texture1Texel, adaptSpeed * 0.0001);
        }
      `,
    },
  }, {
    name: 'Tonemap',
    pass: {
      vertexShader: glsl`
        void main(void) {
          texCoord = texture;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: glsl`
        // @default 0.2
        uniform float exposure;
        // @default 0.8
        uniform float whitePoint;
        // @default 0.0
        uniform float blackPoint;

        void main() {
          // current pixel color and global luminance
          vec4 local = texture2D(texture1Sampler, texCoord);
          vec3 global = texture2D(texture2Sampler, vec2(0.5,0.5)).rgb;
          // perform tone mapping
          float luminance = dot(local.rgb, dotLum);
          float Ld = mapLuminance(luminance, exposure, global.r, blackPoint, whitePoint);
          // scale
          if (luminance > 0.0) {
            local.rgb *= Ld / luminance;
          } else {
            local.rgb *= 0.0;
          }
          local.a = 1.0;
          gl_FragColor = local;
        }
      `,
    },
  }, {
    name: 'Copy',
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
          vec4 color = texture2D(texture1Sampler, uv);
          color.a = 1.0;
          gl_FragColor = color;
        }
      `,
    },
  }],
}

// import { createShaderEffect, Device, Effect, Texture, TextureOptions } from '@gglib/graphics'
// import { Vec2 } from '@gglib/math'
// import { RenderContext } from './RenderContext'
// import { RenderPass } from './Types'

// /**
//  * Constructor options for {@link PostTonemap}
//  *
//  * @public
//  */
// export interface TonemapOptions {
//   enabled?: boolean
//   adaptSpeed?: number
//   exposure?: number
//   blackPoint?: number
//   whitePoint?: number
//   debugTarget?: number
// }

// /**
//  * @public
//  */
// export class PostTonemap implements RenderPass {
//   public get ready() {
//     return this.effect != null
//   }

//   public adaptSpeed: number = 0.2
//   public exposure: number = 0.3
//   public blackPoint: number = 0.0
//   public whitePoint: number = 0.8
//   public enabled: boolean = true
//   public clearNext: boolean = false
//   public debugTarget: number = 0

//   private targets: Texture[] = []
//   private targetOptions: TextureOptions[] = [
//     {
//       width: 512,
//       height: 512,
//     },
//     {
//       width: 128,
//       height: 128,
//     },
//     {
//       width: 32,
//       height: 32,
//     },
//     {
//       width: 8,
//       height: 8,
//     },
//     {
//       width: 2,
//       height: 2,
//     },
//   ]

//   private effect: Effect

//   private lum1: Texture
//   private lum2: Texture
//   private lumOptions: TextureOptions = {
//     width: 2,
//     height: 2,
//   }
//   private texel = Vec2.create()

//   constructor(
//     private device: Device,
//     options?: TonemapOptions,
//   ) {
//     this.enabled = options?.enabled ?? this.enabled
//     this.adaptSpeed = options?.adaptSpeed ?? this.adaptSpeed
//     this.exposure = options?.exposure ?? this.exposure
//     this.blackPoint = options?.blackPoint ?? this.blackPoint
//     this.whitePoint = options?.whitePoint ?? this.whitePoint
//     this.debugTarget = options?.debugTarget ?? this.debugTarget
//     this.createEffect()
//   }

//   private async createEffect() {
//     this.effect = await createShaderEffect(this.device, SHADER)
//   }

//   public setup(ctx: RenderContext) {
//     // get luminance history buffers
//     this.lum1 = ctx.targets.acquire(this.lumOptions)
//     this.lum2 = ctx.targets.acquire(this.lumOptions)
//   }

//   public render(ctx: RenderContext) {
//     if (!this.ready || !this.enabled) {
//       return
//     }

//     const sourceTexture = ctx.channels.color
//     if (!sourceTexture) {
//       console.warn('Tonemap: no color target')
//       return
//     }

//     const programLuminance = this.effect.getTechnique('Luminance').program0
//     const programDownsample = this.effect.getTechnique('Downsample').program0
//     const programCombine = this.effect.getTechnique('Combine').program0
//     const programTonemap = this.effect.getTechnique('Tonemap').program0
//     const programCopy = this.effect.getTechnique('Copy').program0

//     // the resulting buffer
//     const targetBuffer = ctx.targets.acquire({
//       width: sourceTexture.width,
//       height: sourceTexture.height,
//       // depthFormat: sourceTexture.depthFormat,
//     })

//     // get all intermediate downsample buffers
//     for (let i = 0; i < this.targetOptions.length; i++) {
//       this.targets[i] = ctx.targets.acquire(this.targetOptions[i])
//     }

//     const pass = ctx.device.renderPass
//     pass.flush()

//     // TODO: how do we want to set filters
//     // device.textureUnits[0].commit({
//     //   minFilter: TextureFilter.Point,
//     //   magFilter: TextureFilter.Point,
//     //   wrapU: TextureWrapMode.Clamp,
//     //   wrapV: TextureWrapMode.Clamp,
//     // })

//     //
//     // clear intermediate and history buffers
//     //
//     if (this.clearNext) {
//       this.clearNext = false
//       for (const target of this.targets) {
//         pass.setRenderTarget(0, target)
//         pass.clear()
//       }
//       pass.setRenderTarget(0, this.lum1)
//       pass.clear()
//       pass.setRenderTarget(0, this.lum2)
//       pass.clear()
//     }

//     // -------------------------------------------------
//     // [1] DETERMINE LUMINANCE
//     //
//     // perform luminance downscale in 5 steps until 2x2 size is reached
//     for (let i = 0; i < 5; i++) {
//       let program = programLuminance
//       let source = sourceTexture
//       if (i > 0) {
//         program = programDownsample
//         source = this.targets[i - 1]
//       }
//       program.set('texture1', source)
//       program.set('texture1Texel', this.texel.init(1 / source.width, 1 / source.height))
//       pass.setProgram(program)
//       pass.setRenderTarget(0, this.targets[i])
//       // TODO:
//       //device.drawQuad(false)
//       pass.setRenderTarget(0, null)
//     }
//     pass.submit()

//     // combine luminance
//     let thisFrameLuminance = this.targets[this.targets.length - 1]
//     let lastFrameLuminance = this.lum1
//     programCombine.set('texture1', thisFrameLuminance)
//     programCombine.set('texture1Texel', this.texel.init(1 / thisFrameLuminance.width, 1 / thisFrameLuminance.height))
//     programCombine.set('texture2', lastFrameLuminance)
//     programCombine.set('adaptSpeed', this.adaptSpeed)
//     pass.setProgram(programCombine)
//     pass.setRenderTarget(0, this.lum2)
//     // TODO:
//     // device.drawQuad(false)
//     pass.setRenderTarget(0, null)
//     pass.submit()

//     // -------------------------------------------------
//     // [2] APPLY TONEMAPPING
//     //
//     // maps the HDR color values to range in [0:1]

//     // setup tone map effect
//     programTonemap.set('exposure', this.exposure)
//     programTonemap.set('whitePoint', this.whitePoint)
//     programTonemap.set('blackPoint', this.blackPoint)
//     programTonemap.set('texture1', sourceTexture)
//     programTonemap.set('texture1Texel', this.texel.init(1 / sourceTexture.width, 1 / sourceTexture.height))
//     programTonemap.set('texture2', this.lum2)
//     pass.setProgram(programTonemap)
//     pass.setRenderTarget(0, targetBuffer)
//     // TODO:
//     //device.drawQuad(false)
//     pass.setRenderTarget(0, null)

//     //
//     // DEBUG
//     //

//     let di = this.debugTarget - 1
//     let debug = this.targets[di]
//     if (!debug && di > 0) {
//       debug = this.lum2
//     }

//     if (debug) {
//       programCopy.set('texture1', debug)
//       pass.setProgram(programCopy)
//       pass.setRenderTarget(0, targetBuffer)
//       // TODO:
//       //device.drawQuad(false)
//       pass.setRenderTarget(0, null)
//     }

//     // cleanup
//     for (let i = 0; i < this.targetOptions.length; i++) {
//       ctx.targets.release(this.targets[i])
//       this.targets[i] = null
//     }

//     // swap history frames
//     let temp = this.lum2
//     this.lum2 = this.lum1
//     this.lum1 = temp

//     //
//     ctx.swapChannel('color', targetBuffer)
//   }

//   public cleanup(ctx: RenderContext) {
//     ctx.targets.release(this.lum1)
//     ctx.targets.release(this.lum2)
//   }
// }

// const SHADER = {
//   name: 'tonemapping',
//   program: /*glsl*/ `
//     precision highp float;
//     precision highp int;

//     // @binding position
//     attribute vec3 position;

//     // @binding texture
//     attribute vec2 texture;

//     varying vec2 texCoord;

//     // @binding texture1
//     // @register 0
//     uniform sampler2D texture1Sampler;
//     // @binding texture1Texel
//     uniform vec2 texture1Texel;

//     // @binding texture2
//     // @register 1
//     uniform sampler2D texture2Sampler;
//     // @binding texture2Texel
//     uniform vec2 texture2Texel;

//     const vec3 dotLum = vec3(0.2126, 0.7152, 0.0722);

//     vec4 extractLuminance(sampler2D texture, vec2 uv, vec2 texel) {
//       float average = 0.0;
//       float minimum = 1.0;
//       float maximum = -1e20;
//       vec3 color = vec3(0);
//       float lum = 0.0;

//       // get color and calculate luminance
//       color   = texture2D(texture, uv).rgb;
//       lum     = dot(color, dotLum);
//       average = average + lum;
//       minimum = min(minimum, lum);
//       maximum = max(maximum, lum);

//       color   = texture2D(texture, uv + texel).rgb;
//       lum     = dot(color, dotLum);
//       average = average + lum;
//       minimum = min(minimum, lum);
//       maximum = max(maximum, lum);

//       color   = texture2D(texture, uv + vec2(texel.x, 0)).rgb;
//       lum     = dot(color, dotLum);
//       average = average + lum;
//       minimum = min(minimum, lum);
//       maximum = max(maximum, lum);

//       color   = texture2D(texture, uv + vec2(0, texel.y)).rgb;
//       lum     = dot(color, dotLum);
//       average = average + lum;
//       minimum = min(minimum, lum);
//       maximum = max(maximum, lum);

//       average *= 0.25;
//       return vec4(average, maximum, minimum, 1);
//     }

//     vec4 downsample(sampler2D texture, vec2 uv, vec2 texel) {
//       vec3 luminance = vec3(0);
//       vec3 data = vec3(0);

//       data = texture2D(texture, uv).rgb;
//       luminance.r = luminance.r + data.r;
//       luminance.g = max(luminance.g, data.g);
//       luminance.b = min(luminance.b, data.b);

//       data = texture2D(texture, uv + texel).rgb;
//       luminance.r = luminance.r + data.r;
//       luminance.g = max(luminance.g, data.g);
//       luminance.b = min(luminance.b, data.b);

//       data = texture2D(texture, uv + vec2(texel.x, 0)).rgb;
//       luminance.r = luminance.r + data.r;
//       luminance.g = max(luminance.g, data.g);
//       luminance.b = min(luminance.b, data.b);

//       data = texture2D(texture, uv + vec2(0, texel.y)).rgb;
//       luminance.r = luminance.r + data.r;
//       luminance.g = max(luminance.g, data.g);
//       luminance.b = min(luminance.b, data.b);

//       luminance.r *= 0.25;
//       return vec4(luminance.rgb, 1);
//     }

//     vec4 adaptLuminance(sampler2D texture1, sampler2D texture2, vec2 uv, vec2 texel, float speed) {
//       vec3 luminance = vec3(0);

//       vec4 data = texture2D(texture1, uv);
//       luminance.r += data.r;
//       luminance.g = max(luminance.g, data.g);
//       luminance.b = min(luminance.b, data.b);

//       data = texture2D(texture1, uv + texel);
//       luminance.r += data.r;
//       luminance.g = max(luminance.g, data.g);
//       luminance.b = min(luminance.b, data.b);

//       data = texture2D(texture1, uv + vec2(texel.x, 0));
//       luminance.r += data.r;
//       luminance.g = max(luminance.g, data.g);
//       luminance.b = min(luminance.b, data.b);

//       data = texture2D(texture1, uv + vec2(0, texel.y));
//       luminance.r += data.r;
//       luminance.g = max(luminance.g, data.g);
//       luminance.b = min(luminance.b, data.b);

//       luminance.r *= 0.25;

//       vec3 adaptedLum = texture2D(texture2, vec2(0.5, 0.5)).rgb;
//       luminance = adaptedLum + (luminance - adaptedLum) * clamp(speed, 0.0, 1.0);
//       return vec4(luminance.rgb, 1.0);
//     }

//     float mapLuminance(float intensity, float exposure, float avgLum, float black, float white) {
//       // Reinhard's tone mapping equation (See Eqn#3 from  "Photographic Tone
//       // Reproduction for Digital Images" for more details) is:
//       //
//       //      (      (   L     ))
//       // L  * (1.0f +(---------))
//       //      (      ((Lm * Lm)))
//       // -------------------------
//       //         1.0f + L
//       //
//       // L is the luminance at the given point, this is computed using Eqn#2
//       // from the above paper:
//       //
//       //        exposure
//       //   Lp = -------- * intensity
//       //          avg
//       //
//       // The "exposure" ("key" in the above paper) can be used to adjust the
//       // overall "balance" of the image. "avg" is the average luminance across
//       // the scene, computed via the luminance downsampling process.
//       // "intensity" is the measured brightness of the current pixel
//       // being processed.

//       float i = intensity - black;
//       float Ld = 0.0;
//       if (i > 0.0)
//       {
//           float L = exposure / avgLum * i;
//           Ld = L * (1.0 + L / (white * white)) / (1.0 + L);
//       }
//       return Ld;
//     }
//   `,
//   technique: [
//     {
//       name: 'Luminance',
//       pass: {
//         vertexShader: /*glsl*/ `
//         void main(void) {
//           texCoord = texture;
//           gl_Position = vec4(position, 1.0);
//         }
//       `,
//         fragmentShader: /*glsl*/ `
//         void main() {
//           gl_FragColor = extractLuminance(texture1Sampler, texCoord, texture1Texel);
//         }
//       `,
//       },
//     },
//     {
//       name: 'Downsample',
//       pass: {
//         vertexShader: /*glsl*/ `
//         void main(void) {
//           texCoord = texture;
//           gl_Position = vec4(position, 1.0);
//         }
//       `,
//         fragmentShader: /*glsl*/ `
//         void main() {
//           gl_FragColor = downsample(texture1Sampler, texCoord, texture1Texel);
//         }
//       `,
//       },
//     },
//     {
//       name: 'Combine',
//       pass: {
//         vertexShader: /*glsl*/ `
//         void main(void) {
//           texCoord = texture;
//           gl_Position = vec4(position, 1.0);
//         }
//       `,
//         fragmentShader: /*glsl*/ `
//         // @default 0.2
//         uniform float adaptSpeed;

//         void main() {
//           gl_FragColor = adaptLuminance(texture1Sampler, texture2Sampler, texCoord, texture1Texel, adaptSpeed * 0.0001);
//         }
//       `,
//       },
//     },
//     {
//       name: 'Tonemap',
//       pass: {
//         vertexShader: /*glsl*/ `
//         void main(void) {
//           texCoord = texture;
//           gl_Position = vec4(position, 1.0);
//         }
//       `,
//         fragmentShader: /*glsl*/ `
//         // @default 0.2
//         uniform float exposure;
//         // @default 0.8
//         uniform float whitePoint;
//         // @default 0.0
//         uniform float blackPoint;

//         void main() {
//           // current pixel color and global luminance
//           vec4 local = texture2D(texture1Sampler, texCoord);
//           vec3 global = texture2D(texture2Sampler, vec2(0.5,0.5)).rgb;
//           // perform tone mapping
//           float luminance = dot(local.rgb, dotLum);
//           float Ld = mapLuminance(luminance, exposure, global.r, blackPoint, whitePoint);
//           // scale
//           if (luminance > 0.0) {
//             local.rgb *= Ld / luminance;
//           } else {
//             local.rgb *= 0.0;
//           }
//           local.a = 1.0;
//           gl_FragColor = local;
//         }
//       `,
//       },
//     },
//     {
//       name: 'Copy',
//       pass: {
//         vertexShader: /*glsl*/ `
//         void main(void) {
//           texCoord = texture;
//           gl_Position = vec4(position, 1.0);
//         }
//       `,
//         fragmentShader: /*glsl*/ `
//         void main() {
//           vec2 uv = texCoord;
//           vec4 color = texture2D(texture1Sampler, uv);
//           color.a = 1.0;
//           gl_FragColor = color;
//         }
//       `,
//       },
//     },
//   ],
// }

// import {
//   BlendState,
//   Color,
//   createShaderEffectSync,
//   CullState,
//   DepthState,
//   Device,
//   Effect,
//   StencilState,
//   Texture,
// } from '@gglib/graphics'

// import { Vec2 } from '@gglib/math'
// import { POST_TONEMAP } from './tonemap.program'

// /**
//  * Constructor options for {@link PostTonemap}
//  *
//  * @public
//  */
// export interface PostTonemapOptions {
//   adaptSpeed?: number
//   exposure?: number
//   blackPoint?: number
//   whitePoint?: number
// }

// /**
//  * @public
//  */
// export class PostTonemapEffect {
//   /**
//    * Determines whether the post effect is ready to render
//    */
//   public get isReady() {
//     return !!this.effect
//   }
//   /**
//    *
//    */
//   public adaptSpeed: number = 0.2
//   /**
//    *
//    */
//   public exposure: number = 0.3
//   /**
//    *
//    */
//   public blackPoint: number = 0.0
//   /**
//    *
//    */
//   public whitePoint: number = 0.8
//   /**
//    * Input texture
//    */
//   public inputTexture: Texture
//   /**
//    * Output texture
//    *
//    * @remarks
//    * Must be a render target
//    */
//   public outputTexture: Texture
//   /**
//    * Downsample textures
//    *
//    * @remarks
//    * All entries must be render targets sorted by the total
//    * pixel size (width x height), where first entry having
//    * the largest size and last entry having a size of 2x2 pixels
//    */
//   public readonly downsampleTextures: Texture[] = []
//   public lum1: Texture
//   public lum2: Texture
//   public readonly effect: Effect
//   private clear: boolean = true
//   private device: Device
//   private texel = Vec2.createOne()

//   constructor(device: Device, options?: PostTonemapOptions) {
//     this.device = device
//     this.effect = createShaderEffectSync(this.device, POST_TONEMAP)
//     if (options) {
//       this.adaptSpeed = options.adaptSpeed ?? this.adaptSpeed
//       this.exposure = options.exposure ?? this.exposure
//       this.blackPoint = options.blackPoint ?? this.blackPoint
//       this.whitePoint = options.whitePoint ?? this.whitePoint
//     }
//   }

//   /**
//    * Creates luminance render targets
//    */
//   public createLuminanceTargets(sizes = [512, 128, 32, 8, 2]) {
//     sizes.forEach((size, i) => {
//       if (!this.downsampleTextures[i]) {
//         this.downsampleTextures[i] = this.device.createRenderTarget({
//           width: size,
//           height: size,
//         })
//       }
//     })
//     if (!this.lum1) {
//       this.lum1 = this.device.createRenderTarget({ width: 2, height: 2 })
//     }
//     if (!this.lum2) {
//       this.lum2 = this.device.createRenderTarget({ width: 2, height: 2 })
//     }
//   }

//   /**
//    * Releases all luminance render targets
//    */
//   public releaseLuminanceTargets() {
//     this.lum1?.dispose()
//     this.lum1 = null
//     this.lum2?.dispose()
//     this.lum2 = null
//     this.downsampleTextures.forEach((it) => it.dispose())
//     this.downsampleTextures.length = 0
//   }

//   /**
//    * Clears all luminance targets
//    */
//   public clearLuminanceTargets() {
//     const pass = this.device.renderPass
//     pass.setClearColor(0, Color.TransparentBlack)
//     for (const target of this.downsampleTextures) {
//       pass.setRenderTarget(0, target)
//       pass.clear()
//     }
//     pass.setRenderTarget(0, this.lum1)
//     pass.clear()
//     pass.setRenderTarget(0, this.lum2)
//     pass.clear()
//   }

//   public draw() {
//     if (!this.isReady) {
//       throw new Error(`effect is not ready to be used`)
//     }
//     const device = this.device
//     const sourceTexture = this.inputTexture
//     const targetBuffer = this.outputTexture
//     const targets = this.downsampleTextures
//     if (!sourceTexture) {
//       throw new Error(`inputTexture must not be null`)
//     }
//     if (!targetBuffer || !targetBuffer.isRenderTarget) {
//       throw new Error(`outputTexture must be a render target`)
//     }
//     if (!targets.length) {
//       this.createLuminanceTargets()
//       this.clear = true
//     }

//     const programLuminance = this.effect.getTechnique('Luminance').pass(0).program
//     const programDownsample = this.effect.getTechnique('Downsample').pass(0).program
//     const programCombine = this.effect.getTechnique('Combine').pass(0).program
//     const programTonemap = this.effect.getTechnique('Tonemap').pass(0).program

//     const pass = device.renderPass
//     pass.flush()
//     // TODO:
//     // device.textureUnits[0].commit({
//     //   minFilter: TextureFilter.Point,
//     //   magFilter: TextureFilter.Point,
//     //   wrapU: TextureWrapMode.Clamp,
//     //   wrapV: TextureWrapMode.Clamp,
//     // })

//     //
//     // clear intermediate and history buffers
//     //
//     if (this.clear) {
//       this.clear = false
//       this.clearLuminanceTargets()
//     }

//     // -------------------------------------------------
//     // [1] DETERMINE LUMINANCE
//     //
//     // perform luminance downscale in 5 steps until 2x2 size is reached

//     // TODO: make it webgpu compatible
//     for (let i = 0; i < targets.length; i++) {
//       const program = !i ? programLuminance : programDownsample
//       const source = !i ? sourceTexture : targets[i - 1]
//       program.set('texture1', source)
//       program.set('texture1Texel', this.texel.init(1 / source.width, 1 / source.height))
//       pass.setProgram(program)
//       pass.setRenderTarget(0, targets[i])
//       // TODO:
//       // device.drawQuad(false)
//       pass.setRenderTarget(0, null)
//     }

//     // combine luminance
//     let thisFrameLuminance = targets[targets.length - 1]
//     let lastFrameLuminance = this.lum1
//     programCombine.set('texture1', thisFrameLuminance)
//     programCombine.set('texture1Texel', this.texel.init(1 / thisFrameLuminance.width, 1 / thisFrameLuminance.height))
//     programCombine.set('texture2', lastFrameLuminance)
//     programCombine.set('adaptSpeed', this.adaptSpeed)
//     pass.setProgram(programCombine)
//     pass.setRenderTarget(0, this.lum2)
//     // TODO
//     //pass.drawQuad(false)
//     pass.setRenderTarget(0, null)

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
//     // TODO
//     // pass.drawQuad(false)
//     pass.setRenderTarget(0, null)

//     // swap history frames
//     let temp = this.lum2
//     this.lum2 = this.lum1
//     this.lum1 = temp
//   }
// }

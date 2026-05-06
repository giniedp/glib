// import { BlendState, Device, Effect, Program, Texture, createShaderEffectSync } from '@gglib/graphics'
// import { Vec2 } from '@gglib/math'
// import { POST_KAWASE_BLOOM } from './kawase-bloom.program'

// /**
//  * Constructor options for {@link PostBloomKawase}
//  *
//  * @public
//  */
// export interface PostKawaseBloomOptions {
//   glowCut?: number
//   iterations?: number
// }

// function getOption<T, K extends object>(options: K, option: keyof K, fallback: T): T {
//   if (option in options) {
//     return options[option] as any
//   }
//   return fallback
// }

// /**
//  * @public
//  */
// export class PostKawaseBloomEffect {
//   /**
//    * Determines whether the post effect is ready to render
//    */
//   public get isReady() {
//     return this.effect?.isReady()
//   }
//   /**
//    * The graphics device
//    */
//   public readonly device: Device
//   /**
//    * Number of blur iterations
//    */
//   public iterations: number = 5
//   /**
//    * Blur color threshold
//    */
//   public glowCut: number = 0.5
//   /**
//    * The input texture
//    */
//   public inputTexture: Texture
//   /**
//    * Intermediate blur target
//    *
//    * @remarks
//    * Must be a render target
//    */
//   public blurTexture1: Texture
//   /**
//    * Intermediate blur target
//    *
//    * @remarks
//    * Must be a render target
//    */
//   public blurTexture2: Texture
//   /**
//    * The output render target
//    *
//    * @remarks
//    * Must be a render target
//    */
//   public outputTexture: Texture

//   public readonly effect: Effect

//   private texel = Vec2.createOne()

//   constructor(device: Device, options: PostKawaseBloomOptions) {
//     this.device = device
//     this.effect = createShaderEffectSync(this.device, POST_KAWASE_BLOOM)
//     if (options) {
//       this.glowCut = options.glowCut ?? this.glowCut
//       this.iterations = options.iterations ?? this.iterations
//     }
//   }

//   public draw() {
//     const baseTarget = this.inputTexture
//     const resultTarget = this.outputTexture
//     let renderTarget1 = this.blurTexture1
//     let renderTarget2 = this.blurTexture2
//     const texel = this.texel
//     texel.x = 1 / renderTarget1.width
//     texel.y = 1 / renderTarget1.height

//     const pass = this.device.renderPass
//     let program: Program

//     // ------------------------------------------------
//     // GLOW CUT
//     //

//     program = this.effect.getTechnique('glowCut').pass(0).program
//     program.set('threshold', this.glowCut)
//     program.set('texture1', baseTarget)
//     pass.setProgram(program)
//     pass.setRenderBlend(0, BlendState.Disabled)
//     pass.setRenderTarget(0, renderTarget1)
//     // TODO:
//     // device.drawQuad()
//     pass.setRenderTarget(0, null)
//     pass.submit()

//     // ------------------------------------------------
//     // KAWASE ITERATIONS
//     //
//     program = this.effect.getTechnique('kawaseIteration').pass(0).program
//     for (let i = 0; i < this.iterations; i++) {
//       program.set('iteration', i + 1)
//       program.set('texture1', renderTarget1)
//       program.set('texel', texel)
//       pass.setProgram(program)
//       pass.setRenderTarget(0, renderTarget2)
//       // TODO:
//       // pass.drawQuad()
//       pass.setRenderTarget(0, null)
//       let temp = renderTarget1
//       renderTarget1 = renderTarget2
//       renderTarget2 = temp
//       pass.submit()
//     }

//     // ------------------------------------------------
//     // COMBINE
//     //
//     program = this.effect.getTechnique('combine').pass(0).program
//     program.set('texture1', baseTarget)
//     program.set('texture2', renderTarget1)
//     pass.setProgram(program)
//     pass.setRenderTarget(0, resultTarget)
//     // TODO:
//     // pass.drawQuad()
//     pass.setRenderTarget(0, null)
//     pass.submit()
//   }
// }

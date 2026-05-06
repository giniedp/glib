// import { BlendState, Device, Effect, Program, Texture, createShaderEffectSync } from '@gglib/graphics'
// import { IVec2, Vec2 } from '@gglib/math'
// import { POST_KAWASE_STREAKS } from './kawase-streaks.program'

// /**
//  * Constructor options for {@link PostBloomKawase}
//  *
//  * @public
//  */
// export interface PostKawaseStreaksOptions {
//   threshold?: number
//   attenuation?: number
//   iterations?: number
//   directions?: IVec2[]
//   strength?: number
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
// export class PostKawaseStreaksEffect {
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
//    * Blur color threshold
//    */
//   public threshold: number = 0.5
//   /**
//    * Aattenuation value
//    */
//   public attenuation: number = 0.9
//   /**
//    * Number of iterations
//    */
//   public iterations: number = 3
//   /**
//    * Number of iterations per direction
//    */
//   public strength: number = 1.0
//   /**
//    *
//    */
//   public directions: IVec2[] = [
//     { x: 1, y: 1 },
//     { x: 1, y: -1 },
//     { x: -1, y: 1 },
//     { x: -1, y: -1 },
//   ]
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

//   constructor(device: Device, options?: PostKawaseStreaksOptions) {
//     this.device = device
//     this.effect = createShaderEffectSync(this.device, POST_KAWASE_STREAKS)
//     if (options) {
//       this.threshold = options.threshold ?? this.threshold
//       this.attenuation = options.attenuation ?? this.attenuation
//       this.iterations = options.iterations ?? this.iterations
//       this.directions = options.directions ?? this.directions
//       this.strength = options.strength ?? this.strength
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

//     program = this.effect.getTechnique('glowCut').program0
//     program.set('threshold', this.threshold)
//     program.set('texture1', baseTarget)
//     pass.setProgram(program)
//     pass.setRenderBlend(0, BlendState.Disabled)
//     pass.setRenderTarget(0, renderTarget1)
//     // TODO:
//     //device.drawQuad()
//     pass.setRenderTarget(0, null)

//     // ------------------------------------------------
//     // KAWASE ITERATIONS
//     //
//     program = this.effect.getTechnique('kawaseIteration').program0
//     pass.setRenderBlend(0, BlendState.Disabled)
//     for (let i = 0; i < this.iterations; i++) {
//       program.set('attenuation', this.attenuation)
//       program.set('iteration', i)
//       program.set('texture1', renderTarget1)
//       program.set('texel', texel)
//       pass.setProgram(program)
//       pass.setRenderBlend(0, BlendState.Disabled)
//       pass.setRenderTarget(0, renderTarget2)
//       // TODO:
//       // device.drawQuad()
//       pass.setRenderTarget(0, null)
//       let temp = renderTarget1
//       renderTarget1 = renderTarget2
//       renderTarget2 = temp
//     }

//     // ------------------------------------------------
//     // COMBINE
//     //
//     program = this.effect.getTechnique('combine').program0
//     program.set('texture1', baseTarget)
//     program.set('texture2', renderTarget1)
//     program.set('strength', this.strength)
//     pass.setProgram(program)
//     pass.setRenderBlend(0, BlendState.Disabled)
//     pass.setRenderTarget(0, resultTarget)
//     // TODO:
//     // device.drawQuad()
//     pass.setRenderTarget(0, null)
//   }
// }

// import { Color, createShaderEffectSync, DataType, Device, Effect, Texture, TextureOptions } from '@gglib/graphics'
// import { removeItem } from '@gglib/utils'
// import { PRE_IBL_SAMPLER } from './ibl-sampler.program'

// /**
//  * Constructor options for {@link IBLSamplerEffect}
//  *
//  * @public
//  */
// export interface IBLSamplerOptions {
//   textureSize?: number
//   ggxSampleCount?: number
//   lambertianSampleCount?: number
//   sheenSampleCount?: number
//   lodBias?: number
//   lowestMipLevel?: number
//   scaleValue?: number
//   format?: Extract<DataType, 'uint8' | 'float32' | 'float16'>
// }

// /**
//  * Implements simple bloom post processing
//  *
//  * @public
//  */
// export class IBLSamplerEffect {
//   /**
//    * Determines whether the post effect is ready to render
//    */
//   public get isReady() {
//     return !!this.effect?.isReady()
//   }
//   /**
//    * The graphics device
//    */
//   public readonly device: Device

//   /**
//    * The effect with ibl sampler shader
//    */
//   public readonly effect: Effect

//   public textureSize: number = 256
//   public ggxSampleCount: number = 1024
//   public lambertianSampleCount: number = 2048
//   public sheenSampleCount: number = 64
//   public lowestMipLevel: number = 4
//   public scaleValue: number = 1.0
//   public needsUpdate: boolean = false
//   public format: IBLSamplerOptions['format']

//   private distribution: number
//   private roughness: number
//   private targetMipLevel: number
//   private sampleCount: number
//   private lodBias: number = 0

//   public panoramaInput: Texture
//   public cubemapInput: Texture

//   public lambertianCubemap: Texture
//   public ggxCubemap: Texture
//   public sheenCubemap: Texture
//   public ggxLutMap: Texture
//   public sheenLutMap: Texture

//   protected resources: Texture[] = []

//   constructor(device: Device, options?: IBLSamplerOptions) {
//     this.device = device
//     this.textureSize = options?.textureSize ?? this.textureSize
//     this.ggxSampleCount = options?.ggxSampleCount ?? this.ggxSampleCount
//     this.lambertianSampleCount = options?.lambertianSampleCount ?? this.lambertianSampleCount
//     this.sheenSampleCount = options?.sheenSampleCount ?? this.sheenSampleCount
//     this.lowestMipLevel = options?.lowestMipLevel ?? this.lowestMipLevel
//     this.scaleValue = options?.scaleValue ?? this.scaleValue
//     this.format = options?.format ?? 'float16'
//     this.effect = createShaderEffectSync(this.device, PRE_IBL_SAMPLER)
//   }

//   public panoramaToCubemap(inputPanorama: Texture, outputCubemap: Texture) {
//     const pass = this.device.renderPass
//     for (let i = 0; i < 6; i++) {
//       pass.setRenderTarget(0, outputCubemap, 0, i)
//       pass.setClearColor(0, Color.Black)
//       pass.clear()

//       const program = this.effect.getTechnique('panoramaToCubemap').program0
//       program.set('texture', inputPanorama)
//       program.set('currentFace', i)
//       pass.setProgram(program)
//       // TODO:
//       // device.drawQuad(false)
//       pass.setRenderTarget(0, null)
//     }
//     pass.submit()
//     outputCubemap.updateMipmaps()
//   }

//   private sampleCubemap(input: Texture, output: Texture) {
//     const currentTextureSize = this.textureSize >> this.targetMipLevel

//     const pass = this.device.renderPass
//     for (let i = 0; i < 6; ++i) {
//       pass.setRenderTarget(0, output, this.targetMipLevel, i)
//       pass.setViewportState(0, 0, currentTextureSize, currentTextureSize)
//       pass.setClearColor(0, Color.Black)
//       pass.clear()

//       const program = this.effect.getTechnique('iblSample').program0
//       program.set('cubemap', input)
//       program.set('roughness', this.roughness)
//       program.set('sampleCount', this.sampleCount)
//       program.set('width', currentTextureSize)
//       program.set('lodBias', this.lodBias)
//       program.set('distribution', this.distribution)
//       program.set('currentFace', i)
//       program.set('isGeneratingLUT', 0)
//       program.set('floatTexture', 0)
//       // if (this.supportedFormat === 'BYTE') {
//       // } else {
//       //   program.set('floatTexture', 1)
//       // }
//       program.set('intensityScale', this.scaleValue)

//       // TODO:
//       // device.drawQuad()
//       pass.setRenderTarget(0, null)
//     }
//     pass.submit()
//   }

//   private sampleLut(input: Texture, output: Texture) {
//     const pass = this.device.renderPass
//     pass.setRenderTarget(0, output)
//     pass.setClearColor(0, Color.Black)
//     pass.clear()

//     const program = this.effect.getTechnique('iblSample').program0
//     program.set('cubemap', input)
//     program.set('sampleCount', 512)
//     program.set('width', 0)
//     program.set('lodBias', 0)
//     program.set('distribution', this.distribution)
//     program.set('currentFace', 0)
//     program.set('isGeneratingLUT', 1)

//     // TODO:
//     // device.drawQuad()
//     pass.setRenderTarget(0, null)
//     pass.submit()
//     output.updateMipmaps()
//   }

//   public sampleLambertian(inputCubemap: Texture, outputCubemap: Texture) {
//     this.distribution = 0
//     this.roughness = 0
//     this.targetMipLevel = 0
//     this.sampleCount = this.lambertianSampleCount
//     this.sampleCubemap(inputCubemap, outputCubemap)
//     outputCubemap.updateMipmaps()
//   }

//   public sampleGGX(inputCubemap: Texture, outputCubemap: Texture) {
//     const mipmapLevels = Math.floor(Math.log2(outputCubemap.width)) + 1 - this.lowestMipLevel
//     for (let i = 0; i < mipmapLevels; i++) {
//       this.distribution = 1
//       // TODO: make compatible with webgpu
//       this.roughness = i / (mipmapLevels - 1)
//       this.targetMipLevel = i
//       this.sampleCount = this.ggxSampleCount
//       this.sampleCubemap(inputCubemap, outputCubemap)
//     }
//   }

//   public sampleSheen(inputCubemap: Texture, outputCubemap: Texture) {
//     const mipmapLevels = Math.floor(Math.log2(outputCubemap.width)) + 1 - this.lowestMipLevel
//     for (let i = 0; i < mipmapLevels; i++) {
//       this.distribution = 2
//       // TODO: make compatible with webgpu
//       this.roughness = i / (mipmapLevels - 1)
//       this.targetMipLevel = i
//       this.sampleCount = this.sheenSampleCount
//       this.sampleCubemap(inputCubemap, outputCubemap)
//     }
//   }

//   public sampleGGXLut(inputCubemap: Texture, outputLUT: Texture) {
//     this.distribution = 1
//     this.sampleLut(inputCubemap, outputLUT)
//   }

//   public sampleSheenLut(inputCubemap: Texture, outputLUT: Texture) {
//     this.distribution = 2
//     this.sampleLut(inputCubemap, outputLUT)
//   }

//   public draw(inputCubemap: Texture) {
//     this.lambertianCubemap = this.createCubemap(this.lambertianCubemap, 'lambertianCubemap')
//     this.ggxCubemap = this.createCubemap(this.ggxCubemap, 'ggxCubemap')
//     this.sheenCubemap = this.createCubemap(this.sheenCubemap, 'sheenCubemap')
//     this.ggxLutMap = this.createLutMap(this.ggxLutMap, 'ggxLutMap')
//     this.sheenLutMap = this.createLutMap(this.sheenLutMap, 'sheenLutMap')
//     this.sampleLambertian(inputCubemap, this.lambertianCubemap)
//     this.sampleGGX(inputCubemap, this.ggxCubemap)
//     this.sampleSheen(inputCubemap, this.sheenCubemap)
//     this.sampleGGXLut(this.ggxCubemap, this.ggxLutMap)
//     this.sampleSheenLut(this.sheenCubemap, this.sheenLutMap)
//   }

//   public update() {
//     // TODO: need a wayt to detect when input texutre has been uploaded so that we can only update when necessary

//     throw new Error('Not implemented yet')
//     // if (!this.needsUpdate || !this.isReady) {
//     //   return
//     // }

//     // if (this.panoramaInput) {
//     //   // wait for panorama texture to be ready
//     //   this.panoramaInput.update()
//     //   if (!this.panoramaInput.ready) {
//     //     this.needsUpdate = true
//     //     return
//     //   }
//     // }

//     // if (this.cubemapInput) {
//     //   // wait for cubemap texture to be ready
//     //   this.cubemapInput.update()
//     //   if (!this.cubemapInput.ready) {
//     //     this.needsUpdate = true
//     //     return
//     //   }
//     // }

//     // // at this point, either panoramaInput or cubemapInput or both must be set

//     // if (this.panoramaInput) {
//     //   this.cubemapInput = this.createCubemap(this.cubemapInput, 'panoramaCubemap')
//     //   this.panoramaToCubemap(this.panoramaInput, this.cubemapInput)
//     // }

//     // if (this.cubemapInput) {
//     //   this.draw(this.cubemapInput)
//     // } else {
//     //   console.warn('Panorama cubemap is not set')
//     // }

//     // this.needsUpdate = false
//   }

//   private createCubemap(current: Texture, name?: string) {
//     if (current && current.width === this.textureSize) {
//       return current
//     }
//     if (current) {
//       current.dispose()
//       removeItem(this.resources, current)
//     }

//     const options: TextureOptions = {
//       name: name,
//       type: 'TextureCube',
//       width: this.textureSize,
//       height: this.textureSize,
//       generateMipmap: true,
//       // TODO:
//       // sampler: SamplerState.LinearClamp,
//       format: 'RGBA8_UNORM',
//     }
//     if (this.format === 'float16' && this.device.capabilities.canRenderRGBA16F) {
//       options.format = 'RGBA16_FLOAT'
//     }
//     if (this.format === 'float32' && this.device.capabilities.canRenderRGBA32F) {
//       options.format = 'RGBA32_FLOAT'
//     }

//     current = this.device.createTexture(options)
//     this.resources.push(current)
//     current.updateMipmaps()
//     return current
//   }

//   private createLutMap(current: Texture, name?: string) {
//     if (current && current.width === this.textureSize) {
//       return current
//     }
//     if (current) {
//       current.dispose()
//       removeItem(this.resources, current)
//     }
//     const options: TextureOptions = {
//       name: name,
//       type: 'Texture2D',
//       width: this.textureSize,
//       height: this.textureSize,
//       generateMipmap: true,
//       // TODO:
//       // sampler: SamplerState.LinearClamp,
//       format: 'RGBA8_UNORM',
//     }
//     if (this.format === 'float16' && this.device.capabilities.canRenderRGBA16F) {
//       options.format = 'RGBA16_FLOAT'
//     }
//     if (this.format === 'float32' && this.device.capabilities.canRenderRGBA32F) {
//       options.format = 'RGBA32_FLOAT'
//     }
//     current = this.device.createTexture(options)
//     this.resources.push(current)
//     current.updateMipmaps()
//     return current
//   }

//   public dispose() {
//     this.effect.dispose()
//     for (const resource of this.resources) {
//       resource.dispose()
//     }
//     this.resources.length = 0
//   }
// }

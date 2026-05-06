import {
  Device,
  Program,
  Renderable,
  RenderEncoder,
  ShaderModuleOptions,
  Texture,
  typedInputAccessor,
  TypedInputAccessor,
} from '@gglib/graphics'
import { Vec4 } from '@gglib/math'
import {
  BLOOM_GLSL_COMBINE_FRAGMENT,
  BLOOM_GLSL_GLOW_FRAGMENT,
  BLOOM_GLSL_HBLUR_FRAGMENT,
  BLOOM_GLSL_VBLUR_FRAGMENT,
  BLOOM_GLSL_VERTEX,
} from './bloom.glsl'
import { BLOOM_WGSL_COMBINE, BLOOM_WGSL_GLOW, BLOOM_WGSL_HBLUR, BLOOM_WGSL_VBLUR } from './bloom.wgsl'

export function bloomGlowCutShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Bloom GlowCut',
    wgsl: BLOOM_WGSL_GLOW,
    glsl: {
      vertex: BLOOM_GLSL_VERTEX,
      fragment: BLOOM_GLSL_GLOW_FRAGMENT,
    },
  }
}

export function bloomHBlurShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Bloom HBlur',
    wgsl: BLOOM_WGSL_HBLUR,
    glsl: {
      vertex: BLOOM_GLSL_VERTEX,
      fragment: BLOOM_GLSL_HBLUR_FRAGMENT,
    },
  }
}

export function bloomVBlurShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Bloom VBlur',
    wgsl: BLOOM_WGSL_VBLUR,
    glsl: {
      vertex: BLOOM_GLSL_VERTEX,
      fragment: BLOOM_GLSL_VBLUR_FRAGMENT,
    },
  }
}

export function bloomCombineShaderOptions(): ShaderModuleOptions {
  return {
    name: 'Bloom Combine',
    wgsl: BLOOM_WGSL_COMBINE,
    glsl: {
      vertex: BLOOM_GLSL_VERTEX,
      fragment: BLOOM_GLSL_COMBINE_FRAGMENT,
    },
  }
}

export type BloomShaderParams = {
  'params.threshold': number
  'params.multiplier': number
  'params.offsetWeights[0]': Vec4
  'params.offsetWeights[1]': Vec4
  'params.offsetWeights[2]': Vec4
  'params.offsetWeights[3]': Vec4
  'params.offsetWeights[4]': Vec4
  'params.offsetWeights[5]': Vec4
  'params.offsetWeights[6]': Vec4
  'params.offsetWeights[7]': Vec4
  'params.offsetWeights[8]': Vec4
  texture: Texture
  textureBloom: Texture
}

export function bloomShaderParams(): BloomShaderParams {
  return {
    'params.threshold': 0.75,
    'params.multiplier': 0.75,
    'params.offsetWeights[0]': Vec4.create(0, 0, 0, 0),
    'params.offsetWeights[1]': Vec4.create(0, 0, 0, 0),
    'params.offsetWeights[2]': Vec4.create(0, 0, 0, 0),
    'params.offsetWeights[3]': Vec4.create(0, 0, 0, 0),
    'params.offsetWeights[4]': Vec4.create(0, 0, 0, 0),
    'params.offsetWeights[5]': Vec4.create(0, 0, 0, 0),
    'params.offsetWeights[6]': Vec4.create(0, 0, 0, 0),
    'params.offsetWeights[7]': Vec4.create(0, 0, 0, 0),
    'params.offsetWeights[8]': Vec4.create(0, 0, 0, 0),
    texture: null,
    textureBloom: null,
  }
}

export class BloomShader implements Renderable {
  public textureInput: Texture
  public textureTemp1: Texture
  public textureTemp2: Texture
  public textureOuput: Texture

  public glowCut: number = 0.75
  public multiplier: number = 0.75
  public gaussSigma: number = 0.5
  public iterations: number = 5

  private offsetWeights: Array<Vec4>
  private passGlowCut: Program<BloomShaderParams>
  private passHBlur: Program<BloomShaderParams>
  private passVBlur: Program<BloomShaderParams>
  private passCombine: Program<BloomShaderParams>
  private params: TypedInputAccessor<BloomShaderParams>

  public get isReady(): boolean {
    return this.passGlowCut.isReady && this.passHBlur.isReady && this.passVBlur.isReady && this.passCombine.isReady
  }

  public constructor(device: Device) {
    this.passGlowCut = device.createShaderModule(bloomGlowCutShaderOptions()).program.clone()
    this.passHBlur = device.createShaderModule(bloomHBlurShaderOptions()).program.clone()
    this.passVBlur = device.createShaderModule(bloomVBlurShaderOptions()).program.clone()
    this.passCombine = device.createShaderModule(bloomCombineShaderOptions()).program.clone()
    this.params = typedInputAccessor(bloomShaderParams())
  }

  private updateOffsets(texelX: number, texelY: number) {
    const samples = 9
    const samplesOff = Math.floor(samples / 2)
    const offWeights = this.offsetWeights || []
    offWeights.length = samples
    offWeights.length = samples
    this.offsetWeights = offWeights
    for (let i = 0; i < samples; i++) {
      offWeights[i] ||= Vec4.create()
      const data = offWeights[i]
      const off = i - samplesOff
      // Compute the offsets. We take 9 samples - 4 either side and one in the middle:
      //     i =  0,  1,  2,  3, 4,  5,  6,  7,  8
      // Offset = -4, -3, -2, -1, 0, +1, +2, +3, +4
      // half pixel offset to get a sample between the pixels
      data.x = (off + 0.5 * Math.sign(off)) * texelX
      data.y = (off + 0.5 * Math.sign(off)) * texelY
      // map to [-1:+1]
      const norm = off / samplesOff
      data.z = this.multiplier * this.gauss(norm, this.gaussSigma)
      data.w = this.multiplier * this.gauss(norm, this.gaussSigma)
    }
  }

  private gauss(n: number, theta: number) {
    return (1.0 / Math.sqrt(2 * Math.PI * theta)) * Math.exp(-(n * n) / (2.0 * theta * theta))
  }

  public render(pass: RenderEncoder) {
    this.updateOffsets(1.0 / this.textureTemp1.width, 1.0 / this.textureTemp1.height)
    const params = this.params

    params.set('params.offsetWeights[0]', this.offsetWeights[0])
    params.set('params.offsetWeights[1]', this.offsetWeights[1])
    params.set('params.offsetWeights[2]', this.offsetWeights[2])
    params.set('params.offsetWeights[3]', this.offsetWeights[3])
    params.set('params.offsetWeights[4]', this.offsetWeights[4])
    params.set('params.offsetWeights[5]', this.offsetWeights[5])
    params.set('params.offsetWeights[6]', this.offsetWeights[6])
    params.set('params.offsetWeights[7]', this.offsetWeights[7])
    params.set('params.offsetWeights[8]', this.offsetWeights[8])
    params.set('params.multiplier', this.multiplier)
    params.set('params.threshold', this.glowCut)
    params.set('texture', this.textureInput)
    params.set('textureBloom', null)

    this.passGlowCut.apply(params)
    this.passGlowCut.commit()
    pass.setRenderTarget(0, this.textureTemp1)
    pass.setViewportState(0, 0, this.textureTemp1.width, this.textureTemp1.height)
    pass.setProgram(this.passGlowCut)
    pass.draw(3)
    pass.submit()

    for (let n = 0; n < this.iterations; n++) {
      params.set('texture', this.textureTemp1)
      this.passHBlur.apply(params)
      this.passHBlur.commit()
      pass.setRenderTarget(0, this.textureTemp2)
      pass.setViewportState(0, 0, this.textureTemp2.width, this.textureTemp2.height)
      pass.setProgram(this.passHBlur)
      pass.draw(3)
      pass.submit()

      params.set('texture', this.textureTemp2)
      this.passVBlur.apply(params)
      this.passVBlur.commit()
      pass.setRenderTarget(0, this.textureTemp1)
      pass.setViewportState(0, 0, this.textureTemp1.width, this.textureTemp1.height)
      pass.setProgram(this.passVBlur)
      pass.draw(3)
      pass.submit()
    }

    params.set('texture', this.textureInput)
    params.set('textureBloom', this.textureTemp1)
    this.passCombine.apply(params)
    this.passCombine.commit()
    pass.setRenderTarget(0, this.textureOuput)
    pass.setViewportState(0, 0, this.textureOuput.width, this.textureOuput.height)
    pass.setProgram(this.passCombine)
    pass.draw(3)
    pass.submit()
  }
}

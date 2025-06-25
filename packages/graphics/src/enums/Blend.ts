import { GLConst as gl } from './GLConst'

export type Blend =
  | 'BlendAlpha'
  | 'BlendColor'
  | 'DstAlpha'
  | 'DstColor'
  | 'One'
  | 'OneMinusBlendColor'
  | 'OneMinusDstAlpha'
  | 'OneMinusDstColor'
  | 'OneMinusSrcAlpha'
  | 'OneMinusSrcColor'
  | 'SrcAlpha'
  | 'SrcAlphaSaturated'
  | 'SrcColor'
  | 'Zero'

const blendMapToWebGL: Record<Blend, number> = {
  BlendAlpha: gl.CONSTANT_ALPHA,
  BlendColor: gl.CONSTANT_COLOR,
  DstAlpha: gl.DST_ALPHA,
  DstColor: gl.DST_COLOR,
  One: gl.ONE,
  OneMinusBlendColor: gl.ONE_MINUS_CONSTANT_COLOR,
  OneMinusDstAlpha: gl.ONE_MINUS_DST_ALPHA,
  OneMinusDstColor: gl.ONE_MINUS_DST_COLOR,
  OneMinusSrcAlpha: gl.ONE_MINUS_SRC_ALPHA,
  OneMinusSrcColor: gl.ONE_MINUS_SRC_COLOR,
  SrcAlpha: gl.SRC_ALPHA,
  SrcAlphaSaturated: gl.SRC_ALPHA_SATURATE,
  SrcColor: gl.SRC_COLOR,
  Zero: gl.ZERO,
}

const blendMapFromWebGL: Record<number, Blend> = {
  [gl.CONSTANT_ALPHA]: 'BlendAlpha',
  [gl.CONSTANT_COLOR]: 'BlendColor',
  [gl.DST_ALPHA]: 'DstAlpha',
  [gl.DST_COLOR]: 'DstColor',
  [gl.ONE]: 'One',
  [gl.ONE_MINUS_CONSTANT_COLOR]: 'OneMinusBlendColor',
  [gl.ONE_MINUS_DST_ALPHA]: 'OneMinusDstAlpha',
  [gl.ONE_MINUS_DST_COLOR]: 'OneMinusDstColor',
  [gl.ONE_MINUS_SRC_ALPHA]: 'OneMinusSrcAlpha',
  [gl.ONE_MINUS_SRC_COLOR]: 'OneMinusSrcColor',
  [gl.SRC_ALPHA]: 'SrcAlpha',
  [gl.SRC_ALPHA_SATURATE]: 'SrcAlphaSaturated',
  [gl.SRC_COLOR]: 'SrcColor',
  [gl.ZERO]: 'Zero',
}

const blendMapToWebGPU: Record<Blend, GPUBlendFactor> = {
  BlendAlpha: 'blend-color',
  BlendColor: 'blend-color',
  DstAlpha: 'dst-alpha',
  DstColor: 'dst-color',
  One: 'one',
  OneMinusBlendColor: 'one-minus-blend-color',
  OneMinusDstAlpha: 'one-minus-dst-alpha',
  OneMinusDstColor: 'one-minus-dst-color',
  OneMinusSrcAlpha: 'one-minus-src-alpha',
  OneMinusSrcColor: 'one-minus-src-color',
  SrcAlpha: 'src-alpha',
  SrcAlphaSaturated: 'src-alpha-saturated',
  SrcColor: 'src-color',
  Zero: 'zero',
}

export function blendToWebGL(blend: Blend): number {
  return blendMapToWebGL[blend]
}

export function blendFromWebGL(blend: number): Blend {
  return blendMapFromWebGL[blend]
}

export function blendToWebGPU(blend: Blend): GPUBlendFactor {
  return blendMapToWebGPU[blend]
}

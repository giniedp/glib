import { GLConst as gl } from './GLConst'

export type Blend =
  | 'ConstantAlpha'
  | 'ConstantColor'
  | 'DstAlpha'
  | 'DstColor'
  | 'One'
  | 'OneMinusConstant'
  | 'OneMinusDstAlpha'
  | 'OneMinusDstColor'
  | 'OneMinusSrcAlpha'
  | 'OneMinusSrcColor'
  | 'SrcAlpha'
  | 'SrcAlphaSaturated'
  | 'SrcColor'
  | 'Zero'

const blendMapToWebGL: Record<Blend, number> = {
  ConstantAlpha: gl.CONSTANT_ALPHA,
  ConstantColor: gl.CONSTANT_COLOR,
  DstAlpha: gl.DST_ALPHA,
  DstColor: gl.DST_COLOR,
  One: gl.ONE,
  OneMinusConstant: gl.ONE_MINUS_CONSTANT_COLOR,
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
  [gl.CONSTANT_ALPHA]: 'ConstantAlpha',
  [gl.CONSTANT_COLOR]: 'ConstantColor',
  [gl.DST_ALPHA]: 'DstAlpha',
  [gl.DST_COLOR]: 'DstColor',
  [gl.ONE]: 'One',
  [gl.ONE_MINUS_CONSTANT_COLOR]: 'OneMinusConstant',
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
  ConstantAlpha: 'constant',
  ConstantColor: 'constant',
  DstAlpha: 'dst-alpha',
  DstColor: 'dst',
  One: 'one',
  OneMinusConstant: 'one-minus-constant',
  OneMinusDstAlpha: 'one-minus-dst-alpha',
  OneMinusDstColor: 'one-minus-dst',
  OneMinusSrcAlpha: 'one-minus-src-alpha',
  OneMinusSrcColor: 'one-minus-src',
  SrcAlpha: 'src-alpha',
  SrcAlphaSaturated: 'src-alpha-saturated',
  SrcColor: 'src',
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

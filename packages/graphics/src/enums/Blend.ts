import { GLConst as gl } from './GLConst'

export type Blend = Extract<
  GPUBlendFactor,
  | 'constant'
  | 'dst'
  | 'dst-alpha'
  | 'one'
  | 'one-minus-constant'
  | 'one-minus-dst'
  | 'one-minus-dst-alpha'
  | 'one-minus-src'
  | 'one-minus-src-alpha'
  | 'src'
  | 'src-alpha'
  | 'src-alpha-saturated'
  | 'zero'
>

const blendMapToWebGL: Record<Blend, number> = {
  constant: gl.CONSTANT_COLOR,
  'dst-alpha': gl.DST_ALPHA,
  dst: gl.DST_COLOR,
  one: gl.ONE,
  'one-minus-constant': gl.ONE_MINUS_CONSTANT_COLOR,
  'one-minus-dst-alpha': gl.ONE_MINUS_DST_ALPHA,
  'one-minus-dst': gl.ONE_MINUS_DST_COLOR,
  'one-minus-src-alpha': gl.ONE_MINUS_SRC_ALPHA,
  'one-minus-src': gl.ONE_MINUS_SRC_COLOR,
  'src-alpha': gl.SRC_ALPHA,
  'src-alpha-saturated': gl.SRC_ALPHA_SATURATE,
  src: gl.SRC_COLOR,
  zero: gl.ZERO,
}

const blendMapFromWebGL: Record<number, Blend> = {
  [gl.CONSTANT_COLOR]: 'constant',
  [gl.DST_ALPHA]: 'dst-alpha',
  [gl.DST_COLOR]: 'dst',
  [gl.ONE]: 'one',
  [gl.ONE_MINUS_CONSTANT_COLOR]: 'one-minus-constant',
  [gl.ONE_MINUS_DST_ALPHA]: 'one-minus-dst-alpha',
  [gl.ONE_MINUS_DST_COLOR]: 'one-minus-dst',
  [gl.ONE_MINUS_SRC_ALPHA]: 'one-minus-src-alpha',
  [gl.ONE_MINUS_SRC_COLOR]: 'one-minus-src',
  [gl.SRC_ALPHA]: 'src-alpha',
  [gl.SRC_ALPHA_SATURATE]: 'src-alpha-saturated',
  [gl.SRC_COLOR]: 'src',
  [gl.ZERO]: 'zero',
}

export function blendToWebGL(blend: Blend): number {
  return blendMapToWebGL[blend]
}

export function blendFromWebGL(blend: number): Blend {
  return blendMapFromWebGL[blend]
}

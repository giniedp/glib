import { GLConst as gl } from './GLConst'

export type CompareFunction =
  | 'Never'
  | 'Less'
  | 'Equal'
  | 'LessEqual'
  | 'Greater'
  | 'NotEqual'
  | 'GreaterEqual'
  | 'Always'

const mapToWebGL: Record<CompareFunction, number> = {
  Never: gl.NEVER,
  Less: gl.LESS,
  Equal: gl.EQUAL,
  LessEqual: gl.LEQUAL,
  Greater: gl.GREATER,
  NotEqual: gl.NOTEQUAL,
  GreaterEqual: gl.GEQUAL,
  Always: gl.ALWAYS,
}
const mapFromWebGL = Object.fromEntries(Object.entries(mapToWebGL).map(([key, value]) => [value, key] as [number, CompareFunction]))

const mapToWebGPU: Record<CompareFunction, GPUCompareFunction> = {
  Never: 'never',
  Less: 'less',
  Equal: 'equal',
  LessEqual: 'less-equal',
  Greater: 'greater',
  NotEqual: 'not-equal',
  GreaterEqual: 'greater-equal',
  Always: 'always',
}

export function compareFunctionToWebGL(func: CompareFunction): number {
  return mapToWebGL[func]
}

export function compareFunctionFromWebGL(func: number): CompareFunction {
  return mapFromWebGL[func]
}

export function compareFunctionToWebGPU(func: CompareFunction): GPUCompareFunction {
  return mapToWebGPU[func]
}

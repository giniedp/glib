import { GLConst as gl } from './GLConst'

export type BlendFunction = 'Add' | 'Subtract' | 'ReverseSubtract' | 'Min' | 'Max'

const mapToWebGL: Record<BlendFunction, number> = {
  Add: gl.FUNC_ADD,
  Subtract: gl.FUNC_SUBTRACT,
  ReverseSubtract: gl.FUNC_REVERSE_SUBTRACT,
  Min: gl.MIN,
  Max: gl.MAX,
}

const mapFromWebGL: Record<number, BlendFunction> = {
  [gl.FUNC_ADD]: 'Add',
  [gl.FUNC_SUBTRACT]: 'Subtract',
  [gl.FUNC_REVERSE_SUBTRACT]: 'ReverseSubtract',
  [gl.MIN]: 'Min',
  [gl.MAX]: 'Max',
}

const mapToWebGPU: Record<BlendFunction, GPUBlendOperation> = {
  Add: 'add',
  Subtract: 'subtract',
  ReverseSubtract: 'reverse-subtract',
  Min: 'min',
  Max: 'max',
}

const mapFromWebGPU: Record<GPUBlendOperation, BlendFunction> = {
  add: 'Add',
  subtract: 'Subtract',
  'reverse-subtract': 'ReverseSubtract',
  min: 'Min',
  max: 'Max',
}

export function blendFunctionToWebGL(func: BlendFunction): number {
  return mapToWebGL[func]
}

export function blendFunctionFromWebGL(func: number): BlendFunction {
  return mapFromWebGL[func]
}

export function blendFunctionToWebGPU(func: BlendFunction): GPUBlendOperation {
  return mapToWebGPU[func]
}

export function blendFunctionFromWebGPU(func: GPUBlendOperation): BlendFunction {
  return mapFromWebGPU[func]
}

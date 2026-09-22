import { GLConst as gl } from './GLConst'

export type BlendFunction = Extract<GPUBlendOperation, 'add' | 'max' | 'min' | 'reverse-subtract' | 'subtract'>

const mapToWebGL: Record<BlendFunction, number> = {
  add: gl.FUNC_ADD,
  subtract: gl.FUNC_SUBTRACT,
  'reverse-subtract': gl.FUNC_REVERSE_SUBTRACT,
  min: gl.MIN,
  max: gl.MAX,
}

const mapFromWebGL: Record<number, BlendFunction> = {
  [gl.FUNC_ADD]: 'add',
  [gl.FUNC_SUBTRACT]: 'subtract',
  [gl.FUNC_REVERSE_SUBTRACT]: 'reverse-subtract',
  [gl.MIN]: 'min',
  [gl.MAX]: 'max',
}

export function blendFunctionToWebGL(func: BlendFunction): number {
  return mapToWebGL[func]
}

export function blendFunctionFromWebGL(func: number): BlendFunction {
  return mapFromWebGL[func]
}

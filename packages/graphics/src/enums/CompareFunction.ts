import { GLConst as gl } from './GLConst'

export type CompareFunction = Extract<
  GPUCompareFunction,
  'always' | 'equal' | 'greater' | 'greater-equal' | 'less' | 'less-equal' | 'never' | 'not-equal'
>

const mapToWebGL: Record<CompareFunction, number> = {
  never: gl.NEVER,
  less: gl.LESS,
  equal: gl.EQUAL,
  'less-equal': gl.LEQUAL,
  greater: gl.GREATER,
  'not-equal': gl.NOTEQUAL,
  'greater-equal': gl.GEQUAL,
  always: gl.ALWAYS,
}
const mapFromWebGL = Object.fromEntries(
  Object.entries(mapToWebGL).map(([key, value]) => [value, key] as [number, CompareFunction]),
)

export function compareFunctionToWebGL(func: CompareFunction): number {
  return mapToWebGL[func]
}

export function compareFunctionFromWebGL(func: number): CompareFunction {
  return mapFromWebGL[func]
}

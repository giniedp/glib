import { parseSimpleType } from '../core/utils'

export type AnnotateType = 'string'
  | 'bool'
  | 'bool2'
  | 'bool3'
  | 'bool4'
  | 'int'
  | 'int2'
  | 'int3'
  | 'int4'
  | 'float'
  | 'float2'
  | 'float3'
  | 'float4'
  | 'float2x2'
  | 'float3x3'
  | 'float4x4'

export interface Annotate {
  name: string
  type: AnnotateType
  value: string | boolean[] | number[]
}

export function parseAnnotate(el: Element): Annotate {
  const child = el.firstElementChild
  const type = child ? child.tagName : ''
  return {
      name: el.getAttribute('name'),
      ...(type === 'string' ? {
        type: type,
        value: child.textContent,
      } : parseSimpleType(child) as any),
  }
}

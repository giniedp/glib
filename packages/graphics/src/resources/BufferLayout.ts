import { IVec4, Mat4 } from '@gglib/math'

export type BufferFieldType = 'vec4' | 'mat4'

export const BufferFieldSizes: Record<BufferFieldType, number> = {
  vec4: 16,
  mat4: 64,
}

export interface BufferFieldDescriptor<T extends BufferFieldType = BufferFieldType> {
  name: string
  type: T
}

export interface BufferField<T extends BufferFieldType = BufferFieldType> {
  byteOffset: number
  name: string
  type: T
}

export type BufferFields<T extends BufferFieldDescriptor = any> = {
  [K in T['name']]: {
    name: K
    type: Extract<T, { name: K }>['type']
    byteOffset: number
  }
}

export type BufferLayout<T extends Record<string, BufferField> = {}> = {
  stride: number
  fields: T
}

export function bufferLayout<const T extends BufferFieldDescriptor[]>(fields: T) {
  const result = {
    recordByteSize: 0,
    fields: {} as BufferFields<T[number]>,
  }

  let offset = 0
  for (const field of fields) {
    result.fields[field.name] = {
      name: field.name,
      type: field.type,
      byteOffset: offset,
    }
    offset += BufferFieldSizes[field.type]
  }

  result.recordByteSize = offset

  return result
}

export type TransformBufferLayout = typeof TransformBufferLayout
export const TransformBufferLayout = bufferLayout([{ name: 'transform', type: 'mat4' }])

export type TransformColorBufferLayout = typeof TransformColorBufferLayout
export const TransformColorBufferLayout = bufferLayout([
  { name: 'transform', type: 'mat4' },
  { name: 'color', type: 'vec4' },
])

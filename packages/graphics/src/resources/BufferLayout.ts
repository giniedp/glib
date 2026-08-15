import { GpuDataType, gpuTypeSize } from '../enums'

export interface BufferFieldDescriptor<T extends GpuDataType = GpuDataType> {
  name: string
  type: T
}

export interface BufferField<T extends GpuDataType = GpuDataType> {
  byteOffset: number
  type: T
}

export type BufferSchema<T extends BufferFieldDescriptor = any> = {
  [K in T['name']]: {
    type: Extract<T, { name: K }>['type']
    byteOffset: number
  }
}

export function bufferField<N extends string, T extends GpuDataType>(name: N, type: T) {
  return { name, type } //satisfies BufferFieldDescriptor<T>
}

export function bufferLayout<const T extends BufferFieldDescriptor[]>(fields: T) {
  const result = {
    byteSize: 0,
    schema: {} as BufferSchema<T[number]>,
  }

  let offset = 0
  for (const field of fields) {
    result.schema[field.name] = {
      type: field.type,
      byteOffset: offset,
    }
    offset += gpuTypeSize(field.type)
  }

  result.byteSize = offset

  return result
}

export type TransformBufferLayout = typeof TransformBufferLayout
export const TransformBufferLayout = bufferLayout([bufferField('transform', 'mat4x4f')])

export type TransformColorBufferLayout = typeof TransformColorBufferLayout
export const TransformColorBufferLayout = bufferLayout([
  bufferField('transform', 'mat4x4f'),
  bufferField('color', 'vec4f'),
])

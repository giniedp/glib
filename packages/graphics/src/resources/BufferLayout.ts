import { GpuDataType, gpuTypeFormat, gpuTypeSize } from '../enums'
import { VertexAttribute } from './VertexLayout'

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
  } & VertexAttribute
}

export function bufferField<N extends string, T extends GpuDataType>(name: N, type: T) {
  return { name, type }
}

export function bufferLayout<const T extends BufferFieldDescriptor[]>(fields: T) {
  const result = {
    byteSize: 0,
    fields: {} as BufferSchema<T[number]>,
  }

  let offset = 0
  for (const field of fields) {
    const format = gpuTypeFormat(field.type)

    result.fields[field.name] = {
      type: field.type,
      byteOffset: offset,
      elementType: format.elementType,
      elementCount: format.elementCount,
    }

    offset += gpuTypeSize(field.type)
  }

  result.byteSize = offset

  return result
}

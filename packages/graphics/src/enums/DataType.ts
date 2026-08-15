import { GLConst as gl } from './GLConst'

export type DataType = 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'float16'
export type DataTypeViewWriter = (view: DataView, byteOffset: number, value: number) => void
export type DataTypeViewReader = (view: DataView, byteOffset: number) => number

const dataTypeViewWriterMap: Record<DataType, DataTypeViewWriter> = {
  int8: (view, bo, v) => view.setInt8(bo, v),
  uint8: (view, bo, v) => view.setUint8(bo, v),
  int16: (view, bo, v) => view.setInt16(bo, v, true),
  uint16: (view, bo, v) => view.setUint16(bo, v, true),
  int32: (view, bo, v) => view.setInt32(bo, v, true),
  uint32: (view, bo, v) => view.setUint16(bo, v, true),
  float32: (view, bo, v) => view.setFloat32(bo, v, true),
  float16: (view, bo, v) => view.setFloat16(bo, v, true),
}

const dataTypeViewReaderMap: Record<DataType, DataTypeViewReader> = {
  int8: (view, bo) => view.getInt8(bo),
  uint8: (view, bo) => view.getUint8(bo),
  int16: (view, bo) => view.getInt16(bo, true),
  uint16: (view, bo) => view.getUint16(bo, true),
  int32: (view, bo) => view.getInt32(bo, true),
  uint32: (view, bo) => view.getUint16(bo, true),
  float32: (view, bo) => view.getFloat32(bo, true),
  float16: (view, bo) => view.getFloat16(bo, true),
}

const mapToSize: Record<DataType, number> = {
  int8: 1,
  uint8: 1,
  int16: 2,
  uint16: 2,
  int32: 4,
  uint32: 4,
  float32: 4,
  float16: 2,
}

export function dataTypeToSize(type: DataType): number {
  return mapToSize[type]
}

const mapToWebGL: Record<DataType, number> = {
  int8: gl.BYTE,
  uint8: gl.UNSIGNED_BYTE,
  int16: gl.SHORT,
  uint16: gl.UNSIGNED_SHORT,
  int32: gl.INT,
  uint32: gl.UNSIGNED_INT,
  float32: gl.FLOAT,
  float16: gl.HALF_FLOAT,
}

const mapFromWebGL: Record<number, DataType> = {
  [gl.BYTE]: 'int8',
  [gl.UNSIGNED_BYTE]: 'uint8',
  [gl.SHORT]: 'int16',
  [gl.UNSIGNED_SHORT]: 'uint16',
  [gl.INT]: 'int32',
  [gl.UNSIGNED_INT]: 'uint32',
  [gl.FLOAT]: 'float32',
  [gl.HALF_FLOAT]: 'float16',
}

export function dataTypeToWebGL(type: DataType): number {
  return mapToWebGL[type]
}

export function dataTypeFromWebGL(type: number): DataType {
  return mapFromWebGL[type]
}

export const ArrayType = {
  int8: Int8Array,
  uint8: Uint8Array,
  int16: Int16Array,
  uint16: Uint16Array,
  int32: Int32Array,
  uint32: Uint32Array,
  float32: Float32Array,
  float16: Uint16Array,
}

export type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor

export type TypedArray =
  | Int8Array<ArrayBuffer>
  | Uint8Array<ArrayBuffer>
  | Int16Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>
  | Int32Array<ArrayBuffer>
  | Uint32Array<ArrayBuffer>
  | Float32Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>
  | Float16Array<ArrayBuffer>

export function dataTypeToArrayType(type: 'int8'): Int8ArrayConstructor
export function dataTypeToArrayType(type: 'uint8'): Uint8ArrayConstructor
export function dataTypeToArrayType(type: 'int16'): Int16ArrayConstructor
export function dataTypeToArrayType(type: 'uint16'): Uint16ArrayConstructor
export function dataTypeToArrayType(type: 'int32'): Int32ArrayConstructor
export function dataTypeToArrayType(type: 'uint32'): Uint32ArrayConstructor
export function dataTypeToArrayType(type: 'float32'): Float32ArrayConstructor
export function dataTypeToArrayType(type: 'float16'): Uint16ArrayConstructor
export function dataTypeToArrayType(type: DataType): TypedArrayConstructor
export function dataTypeToArrayType(type: DataType): TypedArrayConstructor {
  const result = ArrayType[type]
  if (!result) {
    throw new Error(`Unsupported data type: ${type}`)
  }
  return result
}

export function arrayTypeToDataType(array: TypedArray): DataType {
  for (const key in ArrayType) {
    if (ArrayType[key as DataType] === array.constructor) {
      return key as DataType
    }
  }
  throw new Error(`Unsupported array type: ${array.constructor.name}`)
}

export function dataTypeViewWriter(type: DataType): DataTypeViewWriter {
  return dataTypeViewWriterMap[type]
}

export function dataTypeViewReader(type: DataType): DataTypeViewReader {
  return dataTypeViewReaderMap[type]
}

export function dataTypeArray(type: DataType): TypedArray
export function dataTypeArray(type: DataType, length: number): TypedArray
export function dataTypeArray(type: DataType, values: ArrayLike<number>): TypedArray
export function dataTypeArray(type: DataType, buffer: ArrayBuffer, byteOffset: number, elementCount: number): TypedArray
export function dataTypeArray(
  type: DataType,
  buffer?: ArrayBuffer | number | ArrayLike<number>,
  byteOffset?: number,
  elementCount?: number,
): TypedArray {
  const ArrayType = dataTypeToArrayType(type)
  if (buffer instanceof ArrayBuffer) {
    return new ArrayType(buffer, byteOffset || 0, elementCount)
  }
  if (typeof buffer === 'number') {
    return new ArrayType(buffer)
  }
  return new ArrayType(buffer)
}

export interface DataElementFormat {
  elementType: DataType
  elementCount: number
}

export function dataElementSize(type: DataElementFormat): number {
  console.assert(!!type, 'type must be defined')
  return mapToSize[type.elementType] * type.elementCount
}

export function gpuTypeSize(gpu: GpuDataType): number {
  return dataElementSize(gpuDataFormats[gpu])
}

export function gpuTypeFormat(gpu: GpuDataType): Readonly<DataElementFormat> {
  return gpuDataFormats[gpu]
}

export type GpuDataType =
  | 'i32'
  | 'u32'
  | 'f32'
  | 'h32'
  | `vec${2 | 3 | 4}i`
  | `vec${2 | 3 | 4}u`
  | `vec${2 | 3 | 4}f`
  | `vec${2 | 3 | 4}h`
  | `mat${2 | 3 | 4}x${2 | 3 | 4}f`
  | `mat${2 | 3 | 4}x${2 | 3 | 4}h`

const gpuDataFormats: Record<GpuDataType, Readonly<DataElementFormat>> = {
  i32: Object.freeze({ elementType: 'int32', elementCount: 1 }),
  u32: Object.freeze({ elementType: 'uint32', elementCount: 1 }),
  f32: Object.freeze({ elementType: 'float32', elementCount: 1 }),
  h32: Object.freeze({ elementType: 'float16', elementCount: 1 }),

  vec2i: Object.freeze({ elementType: 'int32', elementCount: 2 }),
  vec2u: Object.freeze({ elementType: 'uint32', elementCount: 2 }),
  vec2f: Object.freeze({ elementType: 'float32', elementCount: 2 }),
  vec2h: Object.freeze({ elementType: 'float16', elementCount: 2 }),

  vec3i: Object.freeze({ elementType: 'int32', elementCount: 3 }),
  vec3u: Object.freeze({ elementType: 'uint32', elementCount: 3 }),
  vec3f: Object.freeze({ elementType: 'float32', elementCount: 3 }),
  vec3h: Object.freeze({ elementType: 'float16', elementCount: 3 }),

  vec4i: Object.freeze({ elementType: 'int32', elementCount: 4 }),
  vec4u: Object.freeze({ elementType: 'uint32', elementCount: 4 }),
  vec4f: Object.freeze({ elementType: 'float32', elementCount: 4 }),
  vec4h: Object.freeze({ elementType: 'float16', elementCount: 4 }),

  mat2x2f: Object.freeze({ elementType: 'float32', elementCount: 2 * 2 }),
  mat2x3f: Object.freeze({ elementType: 'float32', elementCount: 2 * 3 }),
  mat2x4f: Object.freeze({ elementType: 'float32', elementCount: 2 * 4 }),

  mat3x2f: Object.freeze({ elementType: 'float32', elementCount: 3 * 2 }),
  mat3x3f: Object.freeze({ elementType: 'float32', elementCount: 3 * 3 }),
  mat3x4f: Object.freeze({ elementType: 'float32', elementCount: 3 * 4 }),

  mat4x2f: Object.freeze({ elementType: 'float32', elementCount: 4 * 2 }),
  mat4x3f: Object.freeze({ elementType: 'float32', elementCount: 4 * 3 }),
  mat4x4f: Object.freeze({ elementType: 'float32', elementCount: 4 * 4 }),

  mat2x2h: Object.freeze({ elementType: 'float16', elementCount: 2 * 2 }),
  mat2x3h: Object.freeze({ elementType: 'float16', elementCount: 2 * 3 }),
  mat2x4h: Object.freeze({ elementType: 'float16', elementCount: 2 * 4 }),

  mat3x2h: Object.freeze({ elementType: 'float16', elementCount: 3 * 2 }),
  mat3x3h: Object.freeze({ elementType: 'float16', elementCount: 3 * 3 }),
  mat3x4h: Object.freeze({ elementType: 'float16', elementCount: 3 * 4 }),

  mat4x2h: Object.freeze({ elementType: 'float16', elementCount: 4 * 2 }),
  mat4x3h: Object.freeze({ elementType: 'float16', elementCount: 4 * 3 }),
  mat4x4h: Object.freeze({ elementType: 'float16', elementCount: 4 * 4 }),
} satisfies Record<string, DataElementFormat>

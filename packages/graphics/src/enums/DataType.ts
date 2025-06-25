import { GLConst as gl } from './GLConst'

export type DataType = 'int8' | 'uint8' | 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'float16'
export type DataTypeAlias = 'byte' | 'ubyte' | 'short' | 'ushort' | 'int' | 'uint' | 'float' | 'half'

const dataTypeMap: Record<DataTypeAlias | DataType, DataType> = {
  byte: 'int8',
  ubyte: 'uint8',
  short: 'int16',
  ushort: 'uint16',
  int: 'int32',
  uint: 'uint32',
  float: 'float32',
  half: 'float16',
  //
  int8: 'int8',
  uint8: 'uint8',
  int16: 'int16',
  uint16: 'uint16',
  int32: 'int32',
  uint32: 'uint32',
  float32: 'float32',
  float16: 'float16',
}

export function dataType(type: DataType): DataType {
  return dataTypeMap[type]
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
  | Uint16ArrayConstructor

export type TypedArray =
  | Int8Array<ArrayBuffer>
  | Uint8Array<ArrayBuffer>
  | Int16Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>
  | Int32Array<ArrayBuffer>
  | Uint32Array<ArrayBuffer>
  | Float32Array<ArrayBuffer>
  | Uint16Array<ArrayBuffer>

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
  return ArrayType[type]
}

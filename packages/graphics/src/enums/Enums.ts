import { GLConst as gl } from './GLConst'

/**
 * @public
 */
export enum DataType {
  int8 = gl.BYTE,
  int16 = gl.SHORT,
  int32 = gl.INT,
  uint8 = gl.UNSIGNED_BYTE,
  uint16 = gl.UNSIGNED_SHORT,
  uint32 = gl.UNSIGNED_INT,
  float16 = gl.HALF_FLOAT,
  float32 = gl.FLOAT,
  uint16_5_6_5 = gl.UNSIGNED_SHORT_5_6_5,
  uint16_4_4_4_4 = gl.UNSIGNED_SHORT_4_4_4_4,
  uint16_5_5_5_1 = gl.UNSIGNED_SHORT_5_5_5_1,
  uint32_5_9_9_9_REV = gl.UNSIGNED_INT_5_9_9_9_REV,
  uint32_2_10_10_10_REV = gl.UNSIGNED_INT_2_10_10_10_REV,
  uint32_10F_11F_11F_REV = gl.UNSIGNED_INT_10F_11F_11F_REV,
  uint32_24_8 = gl.UNSIGNED_INT_24_8,
}
/**
 * @public
 */
export type DataTypeName = keyof typeof DataType
const DataTypeValueMap = Object.freeze<any>({
  int8: gl.BYTE,
  BYTE: gl.BYTE,
  [gl.BYTE]: gl.BYTE,
  int16: gl.SHORT,
  SHORT: gl.SHORT,
  [gl.SHORT]: gl.SHORT,
  int32: gl.INT,
  INT: gl.INT,
  [gl.INT]: gl.INT,
  uint8: gl.UNSIGNED_BYTE,
  UNSIGNED_BYTE: gl.UNSIGNED_BYTE,
  [gl.UNSIGNED_BYTE]: gl.UNSIGNED_BYTE,
  uint16: gl.UNSIGNED_SHORT,
  UNSIGNED_SHORT: gl.UNSIGNED_SHORT,
  [gl.UNSIGNED_SHORT]: gl.UNSIGNED_SHORT,
  uint32: gl.UNSIGNED_INT,
  UNSIGNED_INT: gl.UNSIGNED_INT,
  [gl.UNSIGNED_INT]: gl.UNSIGNED_INT,
  float16: gl.HALF_FLOAT,
  HALF_FLOAT: gl.HALF_FLOAT,
  [gl.HALF_FLOAT]: gl.HALF_FLOAT,
  float32: gl.FLOAT,
  FLOAT: gl.FLOAT,
  [gl.FLOAT]: gl.FLOAT,
  uint16_5_6_5: gl.UNSIGNED_SHORT_5_6_5,
  UNSIGNED_SHORT_5_6_5: gl.UNSIGNED_SHORT_5_6_5,
  [gl.UNSIGNED_SHORT_5_6_5]: gl.UNSIGNED_SHORT_5_6_5,
  uint16_4_4_4_4: gl.UNSIGNED_SHORT_4_4_4_4,
  UNSIGNED_SHORT_4_4_4_4: gl.UNSIGNED_SHORT_4_4_4_4,
  [gl.UNSIGNED_SHORT_4_4_4_4]: gl.UNSIGNED_SHORT_4_4_4_4,
  uint16_5_5_5_1: gl.UNSIGNED_SHORT_5_5_5_1,
  UNSIGNED_SHORT_5_5_5_1: gl.UNSIGNED_SHORT_5_5_5_1,
  [gl.UNSIGNED_SHORT_5_5_5_1]: gl.UNSIGNED_SHORT_5_5_5_1,
  uint32_5_9_9_9_REV: gl.UNSIGNED_INT_5_9_9_9_REV,
  UNSIGNED_INT_5_9_9_9_REV: gl.UNSIGNED_INT_5_9_9_9_REV,
  [gl.UNSIGNED_INT_5_9_9_9_REV]: gl.UNSIGNED_INT_5_9_9_9_REV,
  uint32_2_10_10_10_REV: gl.UNSIGNED_INT_2_10_10_10_REV,
  UNSIGNED_INT_2_10_10_10_REV: gl.UNSIGNED_INT_2_10_10_10_REV,
  [gl.UNSIGNED_INT_2_10_10_10_REV]: gl.UNSIGNED_INT_2_10_10_10_REV,
  uint32_10F_11F_11F_REV: gl.UNSIGNED_INT_10F_11F_11F_REV,
  UNSIGNED_INT_10F_11F_11F_REV: gl.UNSIGNED_INT_10F_11F_11F_REV,
  [gl.UNSIGNED_INT_10F_11F_11F_REV]: gl.UNSIGNED_INT_10F_11F_11F_REV,
  uint32_24_8: gl.UNSIGNED_INT_24_8,
  UNSIGNED_INT_24_8: gl.UNSIGNED_INT_24_8,
  [gl.UNSIGNED_INT_24_8]: gl.UNSIGNED_INT_24_8,
})
/**
 * @public
 */
export function valueOfDataType(keyOrValue: DataType | DataTypeName): DataType {
  return DataTypeValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfDataType(keyOrValue: DataType | DataTypeName): DataTypeName {
  return DataType[valueOfDataType(keyOrValue)] as DataTypeName
}
/**
 * @public
 */
export type DataTypeOption = DataType | DataTypeName
const dataTypeSizeMap = Object.freeze({
  int8: 1,
  BYTE: 1,
  [gl.BYTE]: 1,
  int16: 2,
  SHORT: 2,
  [gl.SHORT]: 2,
  int32: 4,
  INT: 4,
  [gl.INT]: 4,
  uint8: 1,
  UNSIGNED_BYTE: 1,
  [gl.UNSIGNED_BYTE]: 1,
  uint16: 2,
  UNSIGNED_SHORT: 2,
  [gl.UNSIGNED_SHORT]: 2,
  uint32: 4,
  UNSIGNED_INT: 4,
  [gl.UNSIGNED_INT]: 4,
  float16: 2,
  HALF_FLOAT: 2,
  [gl.HALF_FLOAT]: 2,
  float32: 4,
  FLOAT: 4,
  [gl.FLOAT]: 4,
  uint16_5_6_5: 2,
  UNSIGNED_SHORT_5_6_5: 2,
  [gl.UNSIGNED_SHORT_5_6_5]: 2,
  uint16_4_4_4_4: 2,
  UNSIGNED_SHORT_4_4_4_4: 2,
  [gl.UNSIGNED_SHORT_4_4_4_4]: 2,
  uint16_5_5_5_1: 2,
  UNSIGNED_SHORT_5_5_5_1: 2,
  [gl.UNSIGNED_SHORT_5_5_5_1]: 2,
  uint32_5_9_9_9_REV: 4,
  UNSIGNED_INT_5_9_9_9_REV: 4,
  [gl.UNSIGNED_INT_5_9_9_9_REV]: 4,
  uint32_2_10_10_10_REV: 4,
  UNSIGNED_INT_2_10_10_10_REV: 4,
  [gl.UNSIGNED_INT_2_10_10_10_REV]: 4,
  uint32_10F_11F_11F_REV: 4,
  UNSIGNED_INT_10F_11F_11F_REV: 4,
  [gl.UNSIGNED_INT_10F_11F_11F_REV]: 4,
  uint32_24_8: 4,
  UNSIGNED_INT_24_8: 4,
  [gl.UNSIGNED_INT_24_8]: 4,
})
/**
 * @public
 */
export function dataTypeSize(value: DataTypeOption) {
  return dataTypeSizeMap[value]
}
/**
 * @public
 */
export const ArrayType = Object.freeze({
  int8: Int8Array,
  BYTE: Int8Array,
  [gl.BYTE]: Int8Array,
  int16: Int16Array,
  SHORT: Int16Array,
  [gl.SHORT]: Int16Array,
  int32: Int32Array,
  INT: Int32Array,
  [gl.INT]: Int32Array,
  uint8: Uint8Array,
  UNSIGNED_BYTE: Uint8Array,
  [gl.UNSIGNED_BYTE]: Uint8Array,
  uint16: Uint16Array,
  UNSIGNED_SHORT: Uint16Array,
  [gl.UNSIGNED_SHORT]: Uint16Array,
  uint32: Uint32Array,
  UNSIGNED_INT: Uint32Array,
  [gl.UNSIGNED_INT]: Uint32Array,
  float16: Uint16Array,
  HALF_FLOAT: Uint16Array,
  [gl.HALF_FLOAT]: Uint16Array,
  float32: Float32Array,
  FLOAT: Float32Array,
  [gl.FLOAT]: Float32Array,
  uint16_5_6_5: Uint16Array,
  UNSIGNED_SHORT_5_6_5: Uint16Array,
  [gl.UNSIGNED_SHORT_5_6_5]: Uint16Array,
  uint16_4_4_4_4: Uint16Array,
  UNSIGNED_SHORT_4_4_4_4: Uint16Array,
  [gl.UNSIGNED_SHORT_4_4_4_4]: Uint16Array,
  uint16_5_5_5_1: Uint16Array,
  UNSIGNED_SHORT_5_5_5_1: Uint16Array,
  [gl.UNSIGNED_SHORT_5_5_5_1]: Uint16Array,
  uint32_5_9_9_9_REV: Uint32Array,
  UNSIGNED_INT_5_9_9_9_REV: Uint32Array,
  [gl.UNSIGNED_INT_5_9_9_9_REV]: Uint32Array,
  uint32_2_10_10_10_REV: Uint32Array,
  UNSIGNED_INT_2_10_10_10_REV: Uint32Array,
  [gl.UNSIGNED_INT_2_10_10_10_REV]: Uint32Array,
  uint32_10F_11F_11F_REV: Uint32Array,
  UNSIGNED_INT_10F_11F_11F_REV: Uint32Array,
  [gl.UNSIGNED_INT_10F_11F_11F_REV]: Uint32Array,
  uint32_24_8: Uint32Array,
  UNSIGNED_INT_24_8: Uint32Array,
  [gl.UNSIGNED_INT_24_8]: Uint32Array,
})
/**
 * @public
 */
export enum BufferUsage {
  Static = gl.STATIC_DRAW,
  Dynamic = gl.DYNAMIC_DRAW,
  Stream = gl.STREAM_DRAW,
}
/**
 * @public
 */
export type BufferUsageName = keyof typeof BufferUsage
const BufferUsageValueMap = Object.freeze<any>({
  Static: gl.STATIC_DRAW,
  STATIC_DRAW: gl.STATIC_DRAW,
  [gl.STATIC_DRAW]: gl.STATIC_DRAW,
  Dynamic: gl.DYNAMIC_DRAW,
  DYNAMIC_DRAW: gl.DYNAMIC_DRAW,
  [gl.DYNAMIC_DRAW]: gl.DYNAMIC_DRAW,
  Stream: gl.STREAM_DRAW,
  STREAM_DRAW: gl.STREAM_DRAW,
  [gl.STREAM_DRAW]: gl.STREAM_DRAW,
})
/**
 * @public
 */
export function valueOfBufferUsage(keyOrValue: BufferUsage | BufferUsageName): BufferUsage {
  return BufferUsageValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfBufferUsage(keyOrValue: BufferUsage | BufferUsageName): BufferUsageName {
  return BufferUsage[valueOfBufferUsage(keyOrValue)] as BufferUsageName
}
/**
 * @public
 */
export type BufferUsageOption = BufferUsage | BufferUsageName
/**
 * @public
 */
export enum BufferType {
  VertexBuffer = gl.ARRAY_BUFFER,
  IndexBuffer = gl.ELEMENT_ARRAY_BUFFER,
}
/**
 * @public
 */
export type BufferTypeName = keyof typeof BufferType
const BufferTypeValueMap = Object.freeze<any>({
  VertexBuffer: gl.ARRAY_BUFFER,
  ARRAY_BUFFER: gl.ARRAY_BUFFER,
  [gl.ARRAY_BUFFER]: gl.ARRAY_BUFFER,
  IndexBuffer: gl.ELEMENT_ARRAY_BUFFER,
  ELEMENT_ARRAY_BUFFER: gl.ELEMENT_ARRAY_BUFFER,
  [gl.ELEMENT_ARRAY_BUFFER]: gl.ELEMENT_ARRAY_BUFFER,
})
/**
 * @public
 */
export function valueOfBufferType(keyOrValue: BufferType | BufferTypeName): BufferType {
  return BufferTypeValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfBufferType(keyOrValue: BufferType | BufferTypeName): BufferTypeName {
  return BufferType[valueOfBufferType(keyOrValue)] as BufferTypeName
}
/**
 * @public
 */
export type BufferTypeOption = BufferType | BufferTypeName
/**
 * @public
 */
export enum Blend {
  Zero = gl.ZERO,
  One = gl.ONE,
  SrcColor = gl.SRC_COLOR,
  SrcColorInv = gl.ONE_MINUS_SRC_COLOR,
  SrcAlpha = gl.SRC_ALPHA,
  SrcAlphaInv = gl.ONE_MINUS_SRC_ALPHA,
  SrcAlphaSat = gl.SRC_ALPHA_SATURATE,
  DstColor = gl.DST_COLOR,
  DstColorInv = gl.ONE_MINUS_DST_COLOR,
  DstAlpha = gl.DST_ALPHA,
  DstAlphaInv = gl.ONE_MINUS_DST_ALPHA,
  ConstantColor = gl.CONSTANT_COLOR,
  ConstantColorInv = gl.ONE_MINUS_CONSTANT_COLOR,
  ConstantAlpha = gl.CONSTANT_ALPHA,
  ConstantAlphaInv = gl.ONE_MINUS_CONSTANT_ALPHA,
}
/**
 * @public
 */
export type BlendName = keyof typeof Blend
const BlendValueMap = Object.freeze<any>({
  Zero: gl.ZERO,
  ZERO: gl.ZERO,
  [gl.ZERO]: gl.ZERO,
  One: gl.ONE,
  ONE: gl.ONE,
  [gl.ONE]: gl.ONE,
  SrcColor: gl.SRC_COLOR,
  SRC_COLOR: gl.SRC_COLOR,
  [gl.SRC_COLOR]: gl.SRC_COLOR,
  SrcColorInv: gl.ONE_MINUS_SRC_COLOR,
  ONE_MINUS_SRC_COLOR: gl.ONE_MINUS_SRC_COLOR,
  [gl.ONE_MINUS_SRC_COLOR]: gl.ONE_MINUS_SRC_COLOR,
  SrcAlpha: gl.SRC_ALPHA,
  SRC_ALPHA: gl.SRC_ALPHA,
  [gl.SRC_ALPHA]: gl.SRC_ALPHA,
  SrcAlphaInv: gl.ONE_MINUS_SRC_ALPHA,
  ONE_MINUS_SRC_ALPHA: gl.ONE_MINUS_SRC_ALPHA,
  [gl.ONE_MINUS_SRC_ALPHA]: gl.ONE_MINUS_SRC_ALPHA,
  SrcAlphaSat: gl.SRC_ALPHA_SATURATE,
  SRC_ALPHA_SATURATE: gl.SRC_ALPHA_SATURATE,
  [gl.SRC_ALPHA_SATURATE]: gl.SRC_ALPHA_SATURATE,
  DstColor: gl.DST_COLOR,
  DST_COLOR: gl.DST_COLOR,
  [gl.DST_COLOR]: gl.DST_COLOR,
  DstColorInv: gl.ONE_MINUS_DST_COLOR,
  ONE_MINUS_DST_COLOR: gl.ONE_MINUS_DST_COLOR,
  [gl.ONE_MINUS_DST_COLOR]: gl.ONE_MINUS_DST_COLOR,
  DstAlpha: gl.DST_ALPHA,
  DST_ALPHA: gl.DST_ALPHA,
  [gl.DST_ALPHA]: gl.DST_ALPHA,
  DstAlphaInv: gl.ONE_MINUS_DST_ALPHA,
  ONE_MINUS_DST_ALPHA: gl.ONE_MINUS_DST_ALPHA,
  [gl.ONE_MINUS_DST_ALPHA]: gl.ONE_MINUS_DST_ALPHA,
  ConstantColor: gl.CONSTANT_COLOR,
  CONSTANT_COLOR: gl.CONSTANT_COLOR,
  [gl.CONSTANT_COLOR]: gl.CONSTANT_COLOR,
  ConstantColorInv: gl.ONE_MINUS_CONSTANT_COLOR,
  ONE_MINUS_CONSTANT_COLOR: gl.ONE_MINUS_CONSTANT_COLOR,
  [gl.ONE_MINUS_CONSTANT_COLOR]: gl.ONE_MINUS_CONSTANT_COLOR,
  ConstantAlpha: gl.CONSTANT_ALPHA,
  CONSTANT_ALPHA: gl.CONSTANT_ALPHA,
  [gl.CONSTANT_ALPHA]: gl.CONSTANT_ALPHA,
  ConstantAlphaInv: gl.ONE_MINUS_CONSTANT_ALPHA,
  ONE_MINUS_CONSTANT_ALPHA: gl.ONE_MINUS_CONSTANT_ALPHA,
  [gl.ONE_MINUS_CONSTANT_ALPHA]: gl.ONE_MINUS_CONSTANT_ALPHA,
})
/**
 * @public
 */
export function valueOfBlend(keyOrValue: Blend | BlendName): Blend {
  return BlendValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfBlend(keyOrValue: Blend | BlendName): BlendName {
  return Blend[valueOfBlend(keyOrValue)] as BlendName
}
/**
 * @public
 */
export type BlendOption = Blend | BlendName
/**
 * @public
 */
export enum BlendFunction {
  Add = gl.FUNC_ADD,
  Subtract = gl.FUNC_SUBTRACT,
  ReverseSubtract = gl.FUNC_REVERSE_SUBTRACT,
}
/**
 * @public
 */
export type BlendFunctionName = keyof typeof BlendFunction
const BlendFunctionValueMap = Object.freeze<any>({
  Add: gl.FUNC_ADD,
  FUNC_ADD: gl.FUNC_ADD,
  [gl.FUNC_ADD]: gl.FUNC_ADD,
  Subtract: gl.FUNC_SUBTRACT,
  FUNC_SUBTRACT: gl.FUNC_SUBTRACT,
  [gl.FUNC_SUBTRACT]: gl.FUNC_SUBTRACT,
  ReverseSubtract: gl.FUNC_REVERSE_SUBTRACT,
  FUNC_REVERSE_SUBTRACT: gl.FUNC_REVERSE_SUBTRACT,
  [gl.FUNC_REVERSE_SUBTRACT]: gl.FUNC_REVERSE_SUBTRACT,
})
/**
 * @public
 */
export function valueOfBlendFunction(keyOrValue: BlendFunction | BlendFunctionName): BlendFunction {
  return BlendFunctionValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfBlendFunction(keyOrValue: BlendFunction | BlendFunctionName): BlendFunctionName {
  return BlendFunction[valueOfBlendFunction(keyOrValue)] as BlendFunctionName
}
/**
 * @public
 */
export type BlendFunctionOption = BlendFunction | BlendFunctionName
/**
 * @public
 */
export enum CompareFunction {
  Never = gl.NEVER,
  Less = gl.LESS,
  Equal = gl.EQUAL,
  LessEqual = gl.LEQUAL,
  Greater = gl.GREATER,
  NotEqual = gl.NOTEQUAL,
  GreaterEqual = gl.GEQUAL,
  Always = gl.ALWAYS,
}
/**
 * @public
 */
export type CompareFunctionName = keyof typeof CompareFunction
const CompareFunctionValueMap = Object.freeze<any>({
  Never: gl.NEVER,
  NEVER: gl.NEVER,
  [gl.NEVER]: gl.NEVER,
  Less: gl.LESS,
  LESS: gl.LESS,
  [gl.LESS]: gl.LESS,
  Equal: gl.EQUAL,
  EQUAL: gl.EQUAL,
  [gl.EQUAL]: gl.EQUAL,
  LessEqual: gl.LEQUAL,
  LEQUAL: gl.LEQUAL,
  [gl.LEQUAL]: gl.LEQUAL,
  Greater: gl.GREATER,
  GREATER: gl.GREATER,
  [gl.GREATER]: gl.GREATER,
  NotEqual: gl.NOTEQUAL,
  NOTEQUAL: gl.NOTEQUAL,
  [gl.NOTEQUAL]: gl.NOTEQUAL,
  GreaterEqual: gl.GEQUAL,
  GEQUAL: gl.GEQUAL,
  [gl.GEQUAL]: gl.GEQUAL,
  Always: gl.ALWAYS,
  ALWAYS: gl.ALWAYS,
  [gl.ALWAYS]: gl.ALWAYS,
})
/**
 * @public
 */
export function valueOfCompareFunction(keyOrValue: CompareFunction | CompareFunctionName): CompareFunction {
  return CompareFunctionValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfCompareFunction(keyOrValue: CompareFunction | CompareFunctionName): CompareFunctionName {
  return CompareFunction[valueOfCompareFunction(keyOrValue)] as CompareFunctionName
}
/**
 * @public
 */
export type CompareFunctionOption = CompareFunction | CompareFunctionName
/**
 * @public
 */
export enum CullMode {
  Front = gl.FRONT,
  Back = gl.BACK,
  FrontAndBack = gl.FRONT_AND_BACK,
}
/**
 * @public
 */
export type CullModeName = keyof typeof CullMode
const CullModeValueMap = Object.freeze<any>({
  Front: gl.FRONT,
  FRONT: gl.FRONT,
  [gl.FRONT]: gl.FRONT,
  Back: gl.BACK,
  BACK: gl.BACK,
  [gl.BACK]: gl.BACK,
  FrontAndBack: gl.FRONT_AND_BACK,
  FRONT_AND_BACK: gl.FRONT_AND_BACK,
  [gl.FRONT_AND_BACK]: gl.FRONT_AND_BACK,
})
/**
 * @public
 */
export function valueOfCullMode(keyOrValue: CullMode | CullModeName): CullMode {
  return CullModeValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfCullMode(keyOrValue: CullMode | CullModeName): CullModeName {
  return CullMode[valueOfCullMode(keyOrValue)] as CullModeName
}
/**
 * @public
 */
export type CullModeOption = CullMode | CullModeName
/**
 * @public
 */
export enum FrontFace {
  ClockWise = gl.CW,
  CounterClockWise = gl.CCW,
}
/**
 * @public
 */
export type FrontFaceName = keyof typeof FrontFace
const FrontFaceValueMap = Object.freeze<any>({
  ClockWise: gl.CW,
  CW: gl.CW,
  [gl.CW]: gl.CW,
  CounterClockWise: gl.CCW,
  CCW: gl.CCW,
  [gl.CCW]: gl.CCW,
})
/**
 * @public
 */
export function valueOfFrontFace(keyOrValue: FrontFace | FrontFaceName): FrontFace {
  return FrontFaceValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfFrontFace(keyOrValue: FrontFace | FrontFaceName): FrontFaceName {
  return FrontFace[valueOfFrontFace(keyOrValue)] as FrontFaceName
}
/**
 * @public
 */
export type FrontFaceOption = FrontFace | FrontFaceName
/**
 * @public
 */
export enum StencilOperation {
  Zero = gl.ZERO,
  Keep = gl.KEEP,
  Replace = gl.REPLACE,
  Increment = gl.INCR,
  Decrement = gl.DECR,
  Invert = gl.INVERT,
  IncrementWrap = gl.INCR_WRAP,
  DecrementWrap = gl.DECR_WRAP,
}
/**
 * @public
 */
export type StencilOperationName = keyof typeof StencilOperation
const StencilOperationValueMap = Object.freeze<any>({
  Zero: gl.ZERO,
  ZERO: gl.ZERO,
  [gl.ZERO]: gl.ZERO,
  Keep: gl.KEEP,
  KEEP: gl.KEEP,
  [gl.KEEP]: gl.KEEP,
  Replace: gl.REPLACE,
  REPLACE: gl.REPLACE,
  [gl.REPLACE]: gl.REPLACE,
  Increment: gl.INCR,
  INCR: gl.INCR,
  [gl.INCR]: gl.INCR,
  Decrement: gl.DECR,
  DECR: gl.DECR,
  [gl.DECR]: gl.DECR,
  Invert: gl.INVERT,
  INVERT: gl.INVERT,
  [gl.INVERT]: gl.INVERT,
  IncrementWrap: gl.INCR_WRAP,
  INCR_WRAP: gl.INCR_WRAP,
  [gl.INCR_WRAP]: gl.INCR_WRAP,
  DecrementWrap: gl.DECR_WRAP,
  DECR_WRAP: gl.DECR_WRAP,
  [gl.DECR_WRAP]: gl.DECR_WRAP,
})
/**
 * @public
 */
export function valueOfStencilOperation(keyOrValue: StencilOperation | StencilOperationName): StencilOperation {
  return StencilOperationValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfStencilOperation(keyOrValue: StencilOperation | StencilOperationName): StencilOperationName {
  return StencilOperation[valueOfStencilOperation(keyOrValue)] as StencilOperationName
}
/**
 * @public
 */
export type StencilOperationOption = StencilOperation | StencilOperationName
/**
 * @public
 */
export enum PixelFormat {
  ALPHA = gl.ALPHA,
  LUMINANCE = gl.LUMINANCE,
  LUMINANCE_ALPHA = gl.LUMINANCE_ALPHA,
  RGB = gl.RGB,
  RGBA = gl.RGBA,
  RED = gl.RED,
  RED_INTEGER = gl.RED_INTEGER,
  RG = gl.RG,
  RG_INTEGER = gl.RG_INTEGER,
  RGB_INTEGER = gl.RGB_INTEGER,
  RGBA_INTEGER = gl.RGBA_INTEGER,
}
/**
 * @public
 */
export type PixelFormatName = keyof typeof PixelFormat
const PixelFormatValueMap = Object.freeze<any>({
  ALPHA: gl.ALPHA,
  [gl.ALPHA]: gl.ALPHA,
  LUMINANCE: gl.LUMINANCE,
  [gl.LUMINANCE]: gl.LUMINANCE,
  LUMINANCE_ALPHA: gl.LUMINANCE_ALPHA,
  [gl.LUMINANCE_ALPHA]: gl.LUMINANCE_ALPHA,
  RGB: gl.RGB,
  [gl.RGB]: gl.RGB,
  RGBA: gl.RGBA,
  [gl.RGBA]: gl.RGBA,
  RED: gl.RED,
  [gl.RED]: gl.RED,
  RED_INTEGER: gl.RED_INTEGER,
  [gl.RED_INTEGER]: gl.RED_INTEGER,
  RG: gl.RG,
  [gl.RG]: gl.RG,
  RG_INTEGER: gl.RG_INTEGER,
  [gl.RG_INTEGER]: gl.RG_INTEGER,
  RGB_INTEGER: gl.RGB_INTEGER,
  [gl.RGB_INTEGER]: gl.RGB_INTEGER,
  RGBA_INTEGER: gl.RGBA_INTEGER,
  [gl.RGBA_INTEGER]: gl.RGBA_INTEGER,
})
/**
 * @public
 */
export function valueOfPixelFormat(keyOrValue: PixelFormat | PixelFormatName): PixelFormat {
  return PixelFormatValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfPixelFormat(keyOrValue: PixelFormat | PixelFormatName): PixelFormatName {
  return PixelFormat[valueOfPixelFormat(keyOrValue)] as PixelFormatName
}
/**
 * @public
 */
export type PixelFormatOption = PixelFormat | PixelFormatName
const pixelFormatElementCountMap = Object.freeze({
  ALPHA: 1,
  [gl.ALPHA]: 1,
  LUMINANCE: 1,
  [gl.LUMINANCE]: 1,
  LUMINANCE_ALPHA: 2,
  [gl.LUMINANCE_ALPHA]: 2,
  RGB: 3,
  [gl.RGB]: 3,
  RGBA: 4,
  [gl.RGBA]: 4,
  RED: 1,
  [gl.RED]: 1,
  RED_INTEGER: 1,
  [gl.RED_INTEGER]: 1,
  RG: 2,
  [gl.RG]: 2,
  RG_INTEGER: 2,
  [gl.RG_INTEGER]: 2,
  RGB_INTEGER: 3,
  [gl.RGB_INTEGER]: 3,
  RGBA_INTEGER: 4,
  [gl.RGBA_INTEGER]: 4,
})
/**
 * @public
 */
export function pixelFormatElementCount(value: PixelFormatOption) {
  return pixelFormatElementCountMap[value]
}
/**
 * @public
 */
export enum SurfaceFormat {
  ALPHA = gl.ALPHA,
  LUMINANCE = gl.LUMINANCE,
  LUMINANCE_ALPHA = gl.LUMINANCE_ALPHA,
  RGB = gl.RGB,
  RGBA = gl.RGBA,
  R8 = gl.R8,
  R16F = gl.R16F,
  R32F = gl.R32F,
  R8UI = gl.R8UI,
  RG8 = gl.RG8,
  RG16F = gl.RG16F,
  RG32F = gl.RG32F,
  RG8UI = gl.RG8UI,
  RG16UI = gl.RG16UI,
  RG32UI = gl.RG32UI,
  RGB8 = gl.RGB8,
  SRGB8 = gl.SRGB8,
  RGB565 = gl.RGB565,
  R11F_G11F_B10F = gl.R11F_G11F_B10F,
  RGB9_E5 = gl.RGB9_E5,
  RGB16F = gl.RGB16F,
  RGB32F = gl.RGB32F,
  RGB8UI = gl.RGB8UI,
  RGBA8 = gl.RGBA8,
  SRGB8_ALPHA8 = gl.SRGB8_ALPHA8,
  RGB5_A1 = gl.RGB5_A1,
  RGB10_A2 = gl.RGB10_A2,
  RGBA4 = gl.RGBA4,
  RGBA16F = gl.RGBA16F,
  RGBA32F = gl.RGBA32F,
  RGBA8UI = gl.RGBA8UI,
}
/**
 * @public
 */
export type SurfaceFormatName = keyof typeof SurfaceFormat
const SurfaceFormatValueMap = Object.freeze<any>({
  ALPHA: gl.ALPHA,
  [gl.ALPHA]: gl.ALPHA,
  LUMINANCE: gl.LUMINANCE,
  [gl.LUMINANCE]: gl.LUMINANCE,
  LUMINANCE_ALPHA: gl.LUMINANCE_ALPHA,
  [gl.LUMINANCE_ALPHA]: gl.LUMINANCE_ALPHA,
  RGB: gl.RGB,
  [gl.RGB]: gl.RGB,
  RGBA: gl.RGBA,
  [gl.RGBA]: gl.RGBA,
  R8: gl.R8,
  [gl.R8]: gl.R8,
  R16F: gl.R16F,
  [gl.R16F]: gl.R16F,
  R32F: gl.R32F,
  [gl.R32F]: gl.R32F,
  R8UI: gl.R8UI,
  [gl.R8UI]: gl.R8UI,
  RG8: gl.RG8,
  [gl.RG8]: gl.RG8,
  RG16F: gl.RG16F,
  [gl.RG16F]: gl.RG16F,
  RG32F: gl.RG32F,
  [gl.RG32F]: gl.RG32F,
  RG8UI: gl.RG8UI,
  [gl.RG8UI]: gl.RG8UI,
  RG16UI: gl.RG16UI,
  [gl.RG16UI]: gl.RG16UI,
  RG32UI: gl.RG32UI,
  [gl.RG32UI]: gl.RG32UI,
  RGB8: gl.RGB8,
  [gl.RGB8]: gl.RGB8,
  SRGB8: gl.SRGB8,
  [gl.SRGB8]: gl.SRGB8,
  RGB565: gl.RGB565,
  [gl.RGB565]: gl.RGB565,
  R11F_G11F_B10F: gl.R11F_G11F_B10F,
  [gl.R11F_G11F_B10F]: gl.R11F_G11F_B10F,
  RGB9_E5: gl.RGB9_E5,
  [gl.RGB9_E5]: gl.RGB9_E5,
  RGB16F: gl.RGB16F,
  [gl.RGB16F]: gl.RGB16F,
  RGB32F: gl.RGB32F,
  [gl.RGB32F]: gl.RGB32F,
  RGB8UI: gl.RGB8UI,
  [gl.RGB8UI]: gl.RGB8UI,
  RGBA8: gl.RGBA8,
  [gl.RGBA8]: gl.RGBA8,
  SRGB8_ALPHA8: gl.SRGB8_ALPHA8,
  [gl.SRGB8_ALPHA8]: gl.SRGB8_ALPHA8,
  RGB5_A1: gl.RGB5_A1,
  [gl.RGB5_A1]: gl.RGB5_A1,
  RGB10_A2: gl.RGB10_A2,
  [gl.RGB10_A2]: gl.RGB10_A2,
  RGBA4: gl.RGBA4,
  [gl.RGBA4]: gl.RGBA4,
  RGBA16F: gl.RGBA16F,
  [gl.RGBA16F]: gl.RGBA16F,
  RGBA32F: gl.RGBA32F,
  [gl.RGBA32F]: gl.RGBA32F,
  RGBA8UI: gl.RGBA8UI,
  [gl.RGBA8UI]: gl.RGBA8UI,
})
/**
 * @public
 */
export function valueOfSurfaceFormat(keyOrValue: SurfaceFormat | SurfaceFormatName): SurfaceFormat {
  return SurfaceFormatValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfSurfaceFormat(keyOrValue: SurfaceFormat | SurfaceFormatName): SurfaceFormatName {
  return SurfaceFormat[valueOfSurfaceFormat(keyOrValue)] as SurfaceFormatName
}
/**
 * @public
 */
export type SurfaceFormatOption = SurfaceFormat | SurfaceFormatName
/**
 * @public
 */
export enum PrimitiveType {
  PointList = gl.POINTS,
  LineList = gl.LINES,
  LineStrip = gl.LINE_STRIP,
  TriangleList = gl.TRIANGLES,
  TriangleStrip = gl.TRIANGLE_STRIP,
  TriangleFan = gl.TRIANGLE_FAN,
}
/**
 * @public
 */
export type PrimitiveTypeName = keyof typeof PrimitiveType
const PrimitiveTypeValueMap = Object.freeze<any>({
  PointList: gl.POINTS,
  POINTS: gl.POINTS,
  [gl.POINTS]: gl.POINTS,
  LineList: gl.LINES,
  LINES: gl.LINES,
  [gl.LINES]: gl.LINES,
  LineStrip: gl.LINE_STRIP,
  LINE_STRIP: gl.LINE_STRIP,
  [gl.LINE_STRIP]: gl.LINE_STRIP,
  TriangleList: gl.TRIANGLES,
  TRIANGLES: gl.TRIANGLES,
  [gl.TRIANGLES]: gl.TRIANGLES,
  TriangleStrip: gl.TRIANGLE_STRIP,
  TRIANGLE_STRIP: gl.TRIANGLE_STRIP,
  [gl.TRIANGLE_STRIP]: gl.TRIANGLE_STRIP,
  TriangleFan: gl.TRIANGLE_FAN,
  TRIANGLE_FAN: gl.TRIANGLE_FAN,
  [gl.TRIANGLE_FAN]: gl.TRIANGLE_FAN,
})
/**
 * @public
 */
export function valueOfPrimitiveType(keyOrValue: PrimitiveType | PrimitiveTypeName): PrimitiveType {
  return PrimitiveTypeValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfPrimitiveType(keyOrValue: PrimitiveType | PrimitiveTypeName): PrimitiveTypeName {
  return PrimitiveType[valueOfPrimitiveType(keyOrValue)] as PrimitiveTypeName
}
/**
 * @public
 */
export type PrimitiveTypeOption = PrimitiveType | PrimitiveTypeName
/**
 * @public
 */
export enum TextureType {
  Texture = gl.TEXTURE,
  Texture2D = gl.TEXTURE_2D,
  TextureCube = gl.TEXTURE_CUBE_MAP,
}
/**
 * @public
 */
export type TextureTypeName = keyof typeof TextureType
const TextureTypeValueMap = Object.freeze<any>({
  Texture: gl.TEXTURE,
  TEXTURE: gl.TEXTURE,
  [gl.TEXTURE]: gl.TEXTURE,
  Texture2D: gl.TEXTURE_2D,
  TEXTURE_2D: gl.TEXTURE_2D,
  [gl.TEXTURE_2D]: gl.TEXTURE_2D,
  TextureCube: gl.TEXTURE_CUBE_MAP,
  TEXTURE_CUBE_MAP: gl.TEXTURE_CUBE_MAP,
  [gl.TEXTURE_CUBE_MAP]: gl.TEXTURE_CUBE_MAP,
})
/**
 * @public
 */
export function valueOfTextureType(keyOrValue: TextureType | TextureTypeName): TextureType {
  return TextureTypeValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfTextureType(keyOrValue: TextureType | TextureTypeName): TextureTypeName {
  return TextureType[valueOfTextureType(keyOrValue)] as TextureTypeName
}
/**
 * @public
 */
export type TextureTypeOption = TextureType | TextureTypeName
/**
 * @public
 */
export enum TextureWrapMode {
  Repeat = gl.REPEAT,
  Clamp = gl.CLAMP_TO_EDGE,
  Mirror = gl.MIRRORED_REPEAT,
}
/**
 * @public
 */
export type TextureWrapModeName = keyof typeof TextureWrapMode
const TextureWrapModeValueMap = Object.freeze<any>({
  Repeat: gl.REPEAT,
  REPEAT: gl.REPEAT,
  [gl.REPEAT]: gl.REPEAT,
  Clamp: gl.CLAMP_TO_EDGE,
  CLAMP_TO_EDGE: gl.CLAMP_TO_EDGE,
  [gl.CLAMP_TO_EDGE]: gl.CLAMP_TO_EDGE,
  Mirror: gl.MIRRORED_REPEAT,
  MIRRORED_REPEAT: gl.MIRRORED_REPEAT,
  [gl.MIRRORED_REPEAT]: gl.MIRRORED_REPEAT,
})
/**
 * @public
 */
export function valueOfTextureWrapMode(keyOrValue: TextureWrapMode | TextureWrapModeName): TextureWrapMode {
  return TextureWrapModeValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfTextureWrapMode(keyOrValue: TextureWrapMode | TextureWrapModeName): TextureWrapModeName {
  return TextureWrapMode[valueOfTextureWrapMode(keyOrValue)] as TextureWrapModeName
}
/**
 * @public
 */
export type TextureWrapModeOption = TextureWrapMode | TextureWrapModeName
/**
 * @public
 */
export enum TextureFilter {
  Point = gl.NEAREST,
  Linear = gl.LINEAR,
  PointMipPoint = gl.NEAREST_MIPMAP_NEAREST,
  LinearMipPoint = gl.LINEAR_MIPMAP_NEAREST,
  PointMipLinear = gl.NEAREST_MIPMAP_LINEAR,
  LinearMipLinear = gl.LINEAR_MIPMAP_LINEAR,
}
/**
 * @public
 */
export type TextureFilterName = keyof typeof TextureFilter
const TextureFilterValueMap = Object.freeze<any>({
  Point: gl.NEAREST,
  NEAREST: gl.NEAREST,
  [gl.NEAREST]: gl.NEAREST,
  Linear: gl.LINEAR,
  LINEAR: gl.LINEAR,
  [gl.LINEAR]: gl.LINEAR,
  PointMipPoint: gl.NEAREST_MIPMAP_NEAREST,
  NEAREST_MIPMAP_NEAREST: gl.NEAREST_MIPMAP_NEAREST,
  [gl.NEAREST_MIPMAP_NEAREST]: gl.NEAREST_MIPMAP_NEAREST,
  LinearMipPoint: gl.LINEAR_MIPMAP_NEAREST,
  LINEAR_MIPMAP_NEAREST: gl.LINEAR_MIPMAP_NEAREST,
  [gl.LINEAR_MIPMAP_NEAREST]: gl.LINEAR_MIPMAP_NEAREST,
  PointMipLinear: gl.NEAREST_MIPMAP_LINEAR,
  NEAREST_MIPMAP_LINEAR: gl.NEAREST_MIPMAP_LINEAR,
  [gl.NEAREST_MIPMAP_LINEAR]: gl.NEAREST_MIPMAP_LINEAR,
  LinearMipLinear: gl.LINEAR_MIPMAP_LINEAR,
  LINEAR_MIPMAP_LINEAR: gl.LINEAR_MIPMAP_LINEAR,
  [gl.LINEAR_MIPMAP_LINEAR]: gl.LINEAR_MIPMAP_LINEAR,
})
/**
 * @public
 */
export function valueOfTextureFilter(keyOrValue: TextureFilter | TextureFilterName): TextureFilter {
  return TextureFilterValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfTextureFilter(keyOrValue: TextureFilter | TextureFilterName): TextureFilterName {
  return TextureFilter[valueOfTextureFilter(keyOrValue)] as TextureFilterName
}
/**
 * @public
 */
export type TextureFilterOption = TextureFilter | TextureFilterName
/**
 * @public
 */
export enum ShaderType {
  VertexShader = gl.VERTEX_SHADER,
  FragmentShader = gl.FRAGMENT_SHADER,
}
/**
 * @public
 */
export type ShaderTypeName = keyof typeof ShaderType
const ShaderTypeValueMap = Object.freeze<any>({
  VertexShader: gl.VERTEX_SHADER,
  VERTEX_SHADER: gl.VERTEX_SHADER,
  [gl.VERTEX_SHADER]: gl.VERTEX_SHADER,
  FragmentShader: gl.FRAGMENT_SHADER,
  FRAGMENT_SHADER: gl.FRAGMENT_SHADER,
  [gl.FRAGMENT_SHADER]: gl.FRAGMENT_SHADER,
})
/**
 * @public
 */
export function valueOfShaderType(keyOrValue: ShaderType | ShaderTypeName): ShaderType {
  return ShaderTypeValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfShaderType(keyOrValue: ShaderType | ShaderTypeName): ShaderTypeName {
  return ShaderType[valueOfShaderType(keyOrValue)] as ShaderTypeName
}
/**
 * @public
 */
export type ShaderTypeOption = ShaderType | ShaderTypeName
/**
 * @public
 */
export enum DepthFormat {
  None = gl.ZERO,
  DepthStencil = gl.DEPTH_STENCIL,
  Depth16 = gl.DEPTH_COMPONENT16,
  Depth24 = gl.DEPTH_COMPONENT24,
  Depth32 = gl.DEPTH_COMPONENT32F,
  Depth24Stencil8 = gl.DEPTH24_STENCIL8,
  Depth32Stencil8 = gl.DEPTH32F_STENCIL8,
}
/**
 * @public
 */
export type DepthFormatName = keyof typeof DepthFormat
const DepthFormatValueMap = Object.freeze<any>({
  None: gl.ZERO,
  ZERO: gl.ZERO,
  [gl.ZERO]: gl.ZERO,
  DepthStencil: gl.DEPTH_STENCIL,
  DEPTH_STENCIL: gl.DEPTH_STENCIL,
  [gl.DEPTH_STENCIL]: gl.DEPTH_STENCIL,
  Depth16: gl.DEPTH_COMPONENT16,
  DEPTH_COMPONENT16: gl.DEPTH_COMPONENT16,
  [gl.DEPTH_COMPONENT16]: gl.DEPTH_COMPONENT16,
  Depth24: gl.DEPTH_COMPONENT24,
  DEPTH_COMPONENT24: gl.DEPTH_COMPONENT24,
  [gl.DEPTH_COMPONENT24]: gl.DEPTH_COMPONENT24,
  Depth32: gl.DEPTH_COMPONENT32F,
  DEPTH_COMPONENT32F: gl.DEPTH_COMPONENT32F,
  [gl.DEPTH_COMPONENT32F]: gl.DEPTH_COMPONENT32F,
  Depth24Stencil8: gl.DEPTH24_STENCIL8,
  DEPTH24_STENCIL8: gl.DEPTH24_STENCIL8,
  [gl.DEPTH24_STENCIL8]: gl.DEPTH24_STENCIL8,
  Depth32Stencil8: gl.DEPTH32F_STENCIL8,
  DEPTH32F_STENCIL8: gl.DEPTH32F_STENCIL8,
  [gl.DEPTH32F_STENCIL8]: gl.DEPTH32F_STENCIL8,
})
/**
 * @public
 */
export function valueOfDepthFormat(keyOrValue: DepthFormat | DepthFormatName): DepthFormat {
  return DepthFormatValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfDepthFormat(keyOrValue: DepthFormat | DepthFormatName): DepthFormatName {
  return DepthFormat[valueOfDepthFormat(keyOrValue)] as DepthFormatName
}
/**
 * @public
 */
export type DepthFormatOption = DepthFormat | DepthFormatName
/**
 * @public
 */
export enum StencilFormat {
  Stencil8 = gl.STENCIL_INDEX8,
}
/**
 * @public
 */
export type StencilFormatName = keyof typeof StencilFormat
const StencilFormatValueMap = Object.freeze<any>({
  Stencil8: gl.STENCIL_INDEX8,
  STENCIL_INDEX8: gl.STENCIL_INDEX8,
  [gl.STENCIL_INDEX8]: gl.STENCIL_INDEX8,
})
/**
 * @public
 */
export function valueOfStencilFormat(keyOrValue: StencilFormat | StencilFormatName): StencilFormat {
  return StencilFormatValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfStencilFormat(keyOrValue: StencilFormat | StencilFormatName): StencilFormatName {
  return StencilFormat[valueOfStencilFormat(keyOrValue)] as StencilFormatName
}
/**
 * @public
 */
export type StencilFormatOption = StencilFormat | StencilFormatName
/**
 * @public
 */
export enum LightType {
  None = 0,
  Directional = 1,
  Point = 2,
  Spot = 3,
  Box = 4,
}
/**
 * @public
 */
export type LightTypeName = keyof typeof LightType
const LightTypeValueMap = Object.freeze<any>({
  None: 0,
  [0]: 0,
  Directional: 1,
  [1]: 1,
  Point: 2,
  [2]: 2,
  Spot: 3,
  [3]: 3,
  Box: 4,
  [4]: 4,
})
/**
 * @public
 */
export function valueOfLightType(keyOrValue: LightType | LightTypeName): LightType {
  return LightTypeValueMap[keyOrValue]
}
/**
 * @public
 */
export function nameOfLightType(keyOrValue: LightType | LightTypeName): LightTypeName {
  return LightType[valueOfLightType(keyOrValue)] as LightTypeName
}
/**
 * @public
 */
export type LightTypeOption = LightType | LightTypeName

/**
 * @public
 */
export enum DataType {
  byte = 0x1400,
  short = 0x1402,
  int = 0x1404,
  ubyte = 0x1401,
  ushort = 0x1403,
  uint = 0x1405,
  float = 0x1406,
  ushort565 = 0x8363,
  ushort4444 = 0x8033,
  ushort5551 = 0x8034,
}
/**
 * @public
 */
export type DataTypeName = keyof typeof DataType
const DataTypeValueMap = Object.freeze<any>({
  byte: 0x1400,
  BYTE: 0x1400,
  0x1400: 0x1400,
  short: 0x1402,
  SHORT: 0x1402,
  0x1402: 0x1402,
  int: 0x1404,
  INT: 0x1404,
  0x1404: 0x1404,
  ubyte: 0x1401,
  UNSIGNED_BYTE: 0x1401,
  0x1401: 0x1401,
  ushort: 0x1403,
  UNSIGNED_SHORT: 0x1403,
  0x1403: 0x1403,
  uint: 0x1405,
  UNSIGNED_INT: 0x1405,
  0x1405: 0x1405,
  float: 0x1406,
  FLOAT: 0x1406,
  0x1406: 0x1406,
  ushort565: 0x8363,
  UNSIGNED_SHORT_5_6_5: 0x8363,
  0x8363: 0x8363,
  ushort4444: 0x8033,
  UNSIGNED_SHORT_4_4_4_4: 0x8033,
  0x8033: 0x8033,
  ushort5551: 0x8034,
  UNSIGNED_SHORT_5_5_5_1: 0x8034,
  0x8034: 0x8034,
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
  byte: 1,
  BYTE: 1,
  0x1400: 1,
  short: 2,
  SHORT: 2,
  0x1402: 2,
  int: 4,
  INT: 4,
  0x1404: 4,
  ubyte: 1,
  UNSIGNED_BYTE: 1,
  0x1401: 1,
  ushort: 2,
  UNSIGNED_SHORT: 2,
  0x1403: 2,
  uint: 4,
  UNSIGNED_INT: 4,
  0x1405: 4,
  float: 4,
  FLOAT: 4,
  0x1406: 4,
  ushort565: 2,
  UNSIGNED_SHORT_5_6_5: 2,
  0x8363: 2,
  ushort4444: 2,
  UNSIGNED_SHORT_4_4_4_4: 2,
  0x8033: 2,
  ushort5551: 2,
  UNSIGNED_SHORT_5_5_5_1: 2,
  0x8034: 2,
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
  byte: Int8Array,
  BYTE: Int8Array,
  0x1400: Int8Array,
  short: Int16Array,
  SHORT: Int16Array,
  0x1402: Int16Array,
  int: Int32Array,
  INT: Int32Array,
  0x1404: Int32Array,
  ubyte: Uint8Array,
  UNSIGNED_BYTE: Uint8Array,
  0x1401: Uint8Array,
  ushort: Uint16Array,
  UNSIGNED_SHORT: Uint16Array,
  0x1403: Uint16Array,
  uint: Uint32Array,
  UNSIGNED_INT: Uint32Array,
  0x1405: Uint32Array,
  float: Float32Array,
  FLOAT: Float32Array,
  0x1406: Float32Array,
  ushort565: Uint16Array,
  UNSIGNED_SHORT_5_6_5: Uint16Array,
  0x8363: Uint16Array,
  ushort4444: Uint16Array,
  UNSIGNED_SHORT_4_4_4_4: Uint16Array,
  0x8033: Uint16Array,
  ushort5551: Uint16Array,
  UNSIGNED_SHORT_5_5_5_1: Uint16Array,
  0x8034: Uint16Array,
})
/**
 * @public
 */
export enum BufferUsage {
  Static = 0x88E4,
  Dynamic = 0x88E8,
  Stream = 0x88E0,
}
/**
 * @public
 */
export type BufferUsageName = keyof typeof BufferUsage
const BufferUsageValueMap = Object.freeze<any>({
  Static: 0x88E4,
  STATIC_DRAW: 0x88E4,
  0x88E4: 0x88E4,
  Dynamic: 0x88E8,
  DYNAMIC_DRAW: 0x88E8,
  0x88E8: 0x88E8,
  Stream: 0x88E0,
  STREAM_DRAW: 0x88E0,
  0x88E0: 0x88E0,
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
  VertexBuffer = 0x8892,
  IndexBuffer = 0x8893,
}
/**
 * @public
 */
export type BufferTypeName = keyof typeof BufferType
const BufferTypeValueMap = Object.freeze<any>({
  VertexBuffer: 0x8892,
  ARRAY_BUFFER: 0x8892,
  0x8892: 0x8892,
  IndexBuffer: 0x8893,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  0x8893: 0x8893,
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
  Zero = 0,
  One = 1,
  SrcColor = 0x0300,
  SrcColorInv = 0x0301,
  SrcAlpha = 0x0302,
  SrcAlphaInv = 0x0303,
  SrcAlphaSat = 0x0308,
  DstColor = 0x0306,
  DstColorInv = 0x0307,
  DstAlpha = 0x0304,
  DstAlphaInv = 0x0305,
  ConstantColor = 0x8001,
  ConstantColorInv = 0x8002,
  ConstantAlpha = 0x8003,
  ConstantAlphaInv = 0x8004,
}
/**
 * @public
 */
export type BlendName = keyof typeof Blend
const BlendValueMap = Object.freeze<any>({
  Zero: 0,
  ZERO: 0,
  0: 0,
  One: 1,
  ONE: 1,
  1: 1,
  SrcColor: 0x0300,
  SRC_COLOR: 0x0300,
  0x0300: 0x0300,
  SrcColorInv: 0x0301,
  ONE_MINUS_SRC_COLOR: 0x0301,
  0x0301: 0x0301,
  SrcAlpha: 0x0302,
  SRC_ALPHA: 0x0302,
  0x0302: 0x0302,
  SrcAlphaInv: 0x0303,
  ONE_MINUS_SRC_ALPHA: 0x0303,
  0x0303: 0x0303,
  SrcAlphaSat: 0x0308,
  SRC_ALPHA_SATURATE: 0x0308,
  0x0308: 0x0308,
  DstColor: 0x0306,
  DST_COLOR: 0x0306,
  0x0306: 0x0306,
  DstColorInv: 0x0307,
  ONE_MINUS_DST_COLOR: 0x0307,
  0x0307: 0x0307,
  DstAlpha: 0x0304,
  DST_ALPHA: 0x0304,
  0x0304: 0x0304,
  DstAlphaInv: 0x0305,
  ONE_MINUS_DST_ALPHA: 0x0305,
  0x0305: 0x0305,
  ConstantColor: 0x8001,
  CONSTANT_COLOR: 0x8001,
  0x8001: 0x8001,
  ConstantColorInv: 0x8002,
  ONE_MINUS_CONSTANT_COLOR: 0x8002,
  0x8002: 0x8002,
  ConstantAlpha: 0x8003,
  CONSTANT_ALPHA: 0x8003,
  0x8003: 0x8003,
  ConstantAlphaInv: 0x8004,
  ONE_MINUS_CONSTANT_ALPHA: 0x8004,
  0x8004: 0x8004,
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
  Add = 0x8006,
  Subtract = 0x800A,
  ReverseSubtract = 0x800B,
}
/**
 * @public
 */
export type BlendFunctionName = keyof typeof BlendFunction
const BlendFunctionValueMap = Object.freeze<any>({
  Add: 0x8006,
  FUNC_ADD: 0x8006,
  0x8006: 0x8006,
  Subtract: 0x800A,
  FUNC_SUBTRACT: 0x800A,
  0x800A: 0x800A,
  ReverseSubtract: 0x800B,
  FUNC_REVERSE_SUBTRACT: 0x800B,
  0x800B: 0x800B,
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
  Never = 0x0200,
  Less = 0x0201,
  Equal = 0x0202,
  LessEqual = 0x0203,
  Greater = 0x0204,
  NotEqual = 0x0205,
  GreaterEqual = 0x0206,
  Always = 0x0207,
}
/**
 * @public
 */
export type CompareFunctionName = keyof typeof CompareFunction
const CompareFunctionValueMap = Object.freeze<any>({
  Never: 0x0200,
  NEVER: 0x0200,
  0x0200: 0x0200,
  Less: 0x0201,
  LESS: 0x0201,
  0x0201: 0x0201,
  Equal: 0x0202,
  EQUAL: 0x0202,
  0x0202: 0x0202,
  LessEqual: 0x0203,
  LEQUAL: 0x0203,
  0x0203: 0x0203,
  Greater: 0x0204,
  GREATER: 0x0204,
  0x0204: 0x0204,
  NotEqual: 0x0205,
  NOTEQUAL: 0x0205,
  0x0205: 0x0205,
  GreaterEqual: 0x0206,
  GEQUAL: 0x0206,
  0x0206: 0x0206,
  Always: 0x0207,
  ALWAYS: 0x0207,
  0x0207: 0x0207,
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
  Front = 0x0404,
  Back = 0x0405,
  FrontAndBack = 0x0408,
}
/**
 * @public
 */
export type CullModeName = keyof typeof CullMode
const CullModeValueMap = Object.freeze<any>({
  Front: 0x0404,
  FRONT: 0x0404,
  0x0404: 0x0404,
  Back: 0x0405,
  BACK: 0x0405,
  0x0405: 0x0405,
  FrontAndBack: 0x0408,
  FRONT_AND_BACK: 0x0408,
  0x0408: 0x0408,
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
  ClockWise = 0x0900,
  CounterClockWise = 0x0901,
}
/**
 * @public
 */
export type FrontFaceName = keyof typeof FrontFace
const FrontFaceValueMap = Object.freeze<any>({
  ClockWise: 0x0900,
  CW: 0x0900,
  0x0900: 0x0900,
  CounterClockWise: 0x0901,
  CCW: 0x0901,
  0x0901: 0x0901,
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
  Zero = 0,
  Keep = 0x1E00,
  Replace = 0x1E01,
  Increment = 0x1E02,
  Decrement = 0x1E03,
  Invert = 0x150A,
  IncrementWrap = 0x8507,
  DecrementWrap = 0x8508,
}
/**
 * @public
 */
export type StencilOperationName = keyof typeof StencilOperation
const StencilOperationValueMap = Object.freeze<any>({
  Zero: 0,
  ZERO: 0,
  0: 0,
  Keep: 0x1E00,
  KEEP: 0x1E00,
  0x1E00: 0x1E00,
  Replace: 0x1E01,
  REPLACE: 0x1E01,
  0x1E01: 0x1E01,
  Increment: 0x1E02,
  INCR: 0x1E02,
  0x1E02: 0x1E02,
  Decrement: 0x1E03,
  DECR: 0x1E03,
  0x1E03: 0x1E03,
  Invert: 0x150A,
  INVERT: 0x150A,
  0x150A: 0x150A,
  IncrementWrap: 0x8507,
  INCR_WRAP: 0x8507,
  0x8507: 0x8507,
  DecrementWrap: 0x8508,
  DECR_WRAP: 0x8508,
  0x8508: 0x8508,
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
  Alpha = 0x1906,
  Luminance = 0x1909,
  LuminanceAlpha = 0x190A,
  RGB = 0x1907,
  RGBA = 0x1908,
}
/**
 * @public
 */
export type PixelFormatName = keyof typeof PixelFormat
const PixelFormatValueMap = Object.freeze<any>({
  Alpha: 0x1906,
  ALPHA: 0x1906,
  0x1906: 0x1906,
  Luminance: 0x1909,
  LUMINANCE: 0x1909,
  0x1909: 0x1909,
  LuminanceAlpha: 0x190A,
  LUMINANCE_ALPHA: 0x190A,
  0x190A: 0x190A,
  RGB: 0x1907,
  0x1907: 0x1907,
  RGBA: 0x1908,
  0x1908: 0x1908,
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
  Alpha: 1,
  ALPHA: 1,
  0x1906: 1,
  Luminance: 1,
  LUMINANCE: 1,
  0x1909: 1,
  LuminanceAlpha: 2,
  LUMINANCE_ALPHA: 2,
  0x190A: 2,
  RGB: 3,
  0x1907: 3,
  RGBA: 4,
  0x1908: 4,
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
export enum PrimitiveType {
  PointList = 0x0000,
  LineList = 0x0001,
  LineStrip = 0x0003,
  TriangleList = 0x0004,
  TriangleStrip = 0x0005,
  TriangleFan = 0x0006,
}
/**
 * @public
 */
export type PrimitiveTypeName = keyof typeof PrimitiveType
const PrimitiveTypeValueMap = Object.freeze<any>({
  PointList: 0x0000,
  POINTS: 0x0000,
  0x0000: 0x0000,
  LineList: 0x0001,
  LINES: 0x0001,
  0x0001: 0x0001,
  LineStrip: 0x0003,
  LINE_STRIP: 0x0003,
  0x0003: 0x0003,
  TriangleList: 0x0004,
  TRIANGLES: 0x0004,
  0x0004: 0x0004,
  TriangleStrip: 0x0005,
  TRIANGLE_STRIP: 0x0005,
  0x0005: 0x0005,
  TriangleFan: 0x0006,
  TRIANGLE_FAN: 0x0006,
  0x0006: 0x0006,
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
  Texture = 0x1702,
  Texture2D = 0x0DE1,
  TextureCube = 0x8513,
}
/**
 * @public
 */
export type TextureTypeName = keyof typeof TextureType
const TextureTypeValueMap = Object.freeze<any>({
  Texture: 0x1702,
  TEXTURE: 0x1702,
  0x1702: 0x1702,
  Texture2D: 0x0DE1,
  TEXTURE_2D: 0x0DE1,
  0x0DE1: 0x0DE1,
  TextureCube: 0x8513,
  TEXTURE_CUBE_MAP: 0x8513,
  0x8513: 0x8513,
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
  Repeat = 0x2901,
  Clamp = 0x812F,
  Mirror = 0x8370,
}
/**
 * @public
 */
export type TextureWrapModeName = keyof typeof TextureWrapMode
const TextureWrapModeValueMap = Object.freeze<any>({
  Repeat: 0x2901,
  REPEAT: 0x2901,
  0x2901: 0x2901,
  Clamp: 0x812F,
  CLAMP_TO_EDGE: 0x812F,
  0x812F: 0x812F,
  Mirror: 0x8370,
  MIRRORED_REPEAT: 0x8370,
  0x8370: 0x8370,
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
  Point = 0x2600,
  Linear = 0x2601,
  PointMipPoint = 0x2700,
  LinearMipPoint = 0x2701,
  PointMipLinear = 0x2702,
  LinearMipLinear = 0x2703,
}
/**
 * @public
 */
export type TextureFilterName = keyof typeof TextureFilter
const TextureFilterValueMap = Object.freeze<any>({
  Point: 0x2600,
  NEAREST: 0x2600,
  0x2600: 0x2600,
  Linear: 0x2601,
  LINEAR: 0x2601,
  0x2601: 0x2601,
  PointMipPoint: 0x2700,
  NEAREST_MIPMAP_NEAREST: 0x2700,
  0x2700: 0x2700,
  LinearMipPoint: 0x2701,
  LINEAR_MIPMAP_NEAREST: 0x2701,
  0x2701: 0x2701,
  PointMipLinear: 0x2702,
  NEAREST_MIPMAP_LINEAR: 0x2702,
  0x2702: 0x2702,
  LinearMipLinear: 0x2703,
  LINEAR_MIPMAP_LINEAR: 0x2703,
  0x2703: 0x2703,
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
  VertexShader = 0x8B31,
  FragmentShader = 0x8B30,
}
/**
 * @public
 */
export type ShaderTypeName = keyof typeof ShaderType
const ShaderTypeValueMap = Object.freeze<any>({
  VertexShader: 0x8B31,
  VERTEX_SHADER: 0x8B31,
  0x8B31: 0x8B31,
  FragmentShader: 0x8B30,
  FRAGMENT_SHADER: 0x8B30,
  0x8B30: 0x8B30,
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
  None = 0,
  DepthStencil = 0x84F9,
  Depth16 = 0x81A5,
  Depth24 = 0x81A6,
  Depth32 = 0x8CAC,
  Depth24Stencil8 = 0x88F0,
  Depth32Stencil8 = 0x8CAD,
}
/**
 * @public
 */
export type DepthFormatName = keyof typeof DepthFormat
const DepthFormatValueMap = Object.freeze<any>({
  None: 0,
  ZERO: 0,
  0: 0,
  DepthStencil: 0x84F9,
  DEPTH_STENCIL: 0x84F9,
  0x84F9: 0x84F9,
  Depth16: 0x81A5,
  DEPTH_COMPONENT16: 0x81A5,
  0x81A5: 0x81A5,
  Depth24: 0x81A6,
  DEPTH_COMPONENT24: 0x81A6,
  0x81A6: 0x81A6,
  Depth32: 0x8CAC,
  DEPTH_COMPONENT32F: 0x8CAC,
  0x8CAC: 0x8CAC,
  Depth24Stencil8: 0x88F0,
  DEPTH24_STENCIL8: 0x88F0,
  0x88F0: 0x88F0,
  Depth32Stencil8: 0x8CAD,
  DEPTH32F_STENCIL8: 0x8CAD,
  0x8CAD: 0x8CAD,
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
  Stencil8 = 0x8D48,
}
/**
 * @public
 */
export type StencilFormatName = keyof typeof StencilFormat
const StencilFormatValueMap = Object.freeze<any>({
  Stencil8: 0x8D48,
  STENCIL_INDEX8: 0x8D48,
  0x8D48: 0x8D48,
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
  0: 0,
  Directional: 1,
  1: 1,
  Point: 2,
  2: 2,
  Spot: 3,
  3: 3,
  Box: 4,
  4: 4,
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

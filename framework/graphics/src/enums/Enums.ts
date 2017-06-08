
export type DataTypeOption =
    'byte'
  | 'short'
  | 'int'
  | 'ubyte'
  | 'ushort'
  | 'uint'
  | 'float'
  | 'ushort565'
  | 'ushort4444'
  | 'ushort5551'
  | 'BYTE'
  | 'SHORT'
  | 'INT'
  | 'UNSIGNED_BYTE'
  | 'UNSIGNED_SHORT'
  | 'UNSIGNED_INT'
  | 'FLOAT'
  | 'UNSIGNED_SHORT_5_6_5'
  | 'UNSIGNED_SHORT_4_4_4_4'
  | 'UNSIGNED_SHORT_5_5_5_1'
  | number

export const DataType = Object.freeze({
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
  nameOf: (name: string|number): string => mapDataTypeName[name],
})
const mapDataTypeName = Object.freeze({
  byte: 'BYTE',
  BYTE: 'BYTE',
  0x1400: 'BYTE',
  short: 'SHORT',
  SHORT: 'SHORT',
  0x1402: 'SHORT',
  int: 'INT',
  INT: 'INT',
  0x1404: 'INT',
  ubyte: 'UNSIGNED_BYTE',
  UNSIGNED_BYTE: 'UNSIGNED_BYTE',
  0x1401: 'UNSIGNED_BYTE',
  ushort: 'UNSIGNED_SHORT',
  UNSIGNED_SHORT: 'UNSIGNED_SHORT',
  0x1403: 'UNSIGNED_SHORT',
  uint: 'UNSIGNED_INT',
  UNSIGNED_INT: 'UNSIGNED_INT',
  0x1405: 'UNSIGNED_INT',
  float: 'FLOAT',
  FLOAT: 'FLOAT',
  0x1406: 'FLOAT',
  ushort565: 'UNSIGNED_SHORT_5_6_5',
  UNSIGNED_SHORT_5_6_5: 'UNSIGNED_SHORT_5_6_5',
  0x8363: 'UNSIGNED_SHORT_5_6_5',
  ushort4444: 'UNSIGNED_SHORT_4_4_4_4',
  UNSIGNED_SHORT_4_4_4_4: 'UNSIGNED_SHORT_4_4_4_4',
  0x8033: 'UNSIGNED_SHORT_4_4_4_4',
  ushort5551: 'UNSIGNED_SHORT_5_5_5_1',
  UNSIGNED_SHORT_5_5_5_1: 'UNSIGNED_SHORT_5_5_5_1',
  0x8034: 'UNSIGNED_SHORT_5_5_5_1',
})
export type DataSizeOption =
    'byte'
  | 'short'
  | 'int'
  | 'ubyte'
  | 'ushort'
  | 'uint'
  | 'float'
  | 'ushort565'
  | 'ushort4444'
  | 'ushort5551'
  | 'BYTE'
  | 'SHORT'
  | 'INT'
  | 'UNSIGNED_BYTE'
  | 'UNSIGNED_SHORT'
  | 'UNSIGNED_INT'
  | 'FLOAT'
  | 'UNSIGNED_SHORT_5_6_5'
  | 'UNSIGNED_SHORT_4_4_4_4'
  | 'UNSIGNED_SHORT_5_5_5_1'
  | number

export const DataSize = Object.freeze({
  byte: 1,
  1: 1,
  BYTE: 1,
  0x1400: 1,
  short: 2,
  2: 2,
  SHORT: 2,
  0x1402: 2,
  int: 4,
  4: 4,
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
export type ArrayTypeOption =
    'byte'
  | 'short'
  | 'int'
  | 'ubyte'
  | 'ushort'
  | 'uint'
  | 'float'
  | 'ushort565'
  | 'ushort4444'
  | 'ushort5551'
  | 'BYTE'
  | 'SHORT'
  | 'INT'
  | 'UNSIGNED_BYTE'
  | 'UNSIGNED_SHORT'
  | 'UNSIGNED_INT'
  | 'FLOAT'
  | 'UNSIGNED_SHORT_5_6_5'
  | 'UNSIGNED_SHORT_4_4_4_4'
  | 'UNSIGNED_SHORT_5_5_5_1'
  | any

export const ArrayType = Object.freeze({
  byte: Int8Array,
  Int8Array: Int8Array,
  BYTE: Int8Array,
  0x1400: Int8Array,
  short: Int16Array,
  Int16Array: Int16Array,
  SHORT: Int16Array,
  0x1402: Int16Array,
  int: Int32Array,
  Int32Array: Int32Array,
  INT: Int32Array,
  0x1404: Int32Array,
  ubyte: Uint8Array,
  Uint8Array: Uint8Array,
  UNSIGNED_BYTE: Uint8Array,
  0x1401: Uint8Array,
  ushort: Uint16Array,
  Uint16Array: Uint16Array,
  UNSIGNED_SHORT: Uint16Array,
  0x1403: Uint16Array,
  uint: Uint32Array,
  Uint32Array: Uint32Array,
  UNSIGNED_INT: Uint32Array,
  0x1405: Uint32Array,
  float: Float32Array,
  Float32Array: Float32Array,
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
  nameOf: (name: string|number): string => mapArrayTypeName[name],
})
const mapArrayTypeName = Object.freeze({
  byte: 'Int8Array',
  Int8Array: 'Int8Array',
  BYTE: 'Int8Array',
  0x1400: 'Int8Array',
  short: 'Int16Array',
  Int16Array: 'Int16Array',
  SHORT: 'Int16Array',
  0x1402: 'Int16Array',
  int: 'Int32Array',
  Int32Array: 'Int32Array',
  INT: 'Int32Array',
  0x1404: 'Int32Array',
  ubyte: 'Uint8Array',
  Uint8Array: 'Uint8Array',
  UNSIGNED_BYTE: 'Uint8Array',
  0x1401: 'Uint8Array',
  ushort: 'Uint16Array',
  Uint16Array: 'Uint16Array',
  UNSIGNED_SHORT: 'Uint16Array',
  0x1403: 'Uint16Array',
  uint: 'Uint32Array',
  Uint32Array: 'Uint32Array',
  UNSIGNED_INT: 'Uint32Array',
  0x1405: 'Uint32Array',
  float: 'Float32Array',
  Float32Array: 'Float32Array',
  FLOAT: 'Float32Array',
  0x1406: 'Float32Array',
  ushort565: 'Uint16Array',
  UNSIGNED_SHORT_5_6_5: 'Uint16Array',
  0x8363: 'Uint16Array',
  ushort4444: 'Uint16Array',
  UNSIGNED_SHORT_4_4_4_4: 'Uint16Array',
  0x8033: 'Uint16Array',
  ushort5551: 'Uint16Array',
  UNSIGNED_SHORT_5_5_5_1: 'Uint16Array',
  0x8034: 'Uint16Array',
})
export type BufferUsageOption =
    'Static'
  | 'Dynamic'
  | 'Stream'
  | 'STATIC_DRAW'
  | 'DYNAMIC_DRAW'
  | 'STREAM_DRAW'
  | number

export const BufferUsage = Object.freeze({
  Static: 0x88E4,
  STATIC_DRAW: 0x88E4,
  0x88E4: 0x88E4,
  Dynamic: 0x88E8,
  DYNAMIC_DRAW: 0x88E8,
  0x88E8: 0x88E8,
  Stream: 0x88E0,
  STREAM_DRAW: 0x88E0,
  0x88E0: 0x88E0,
  nameOf: (name: string|number): string => mapBufferUsageName[name],
})
const mapBufferUsageName = Object.freeze({
  Static: 'STATIC_DRAW',
  STATIC_DRAW: 'STATIC_DRAW',
  0x88E4: 'STATIC_DRAW',
  Dynamic: 'DYNAMIC_DRAW',
  DYNAMIC_DRAW: 'DYNAMIC_DRAW',
  0x88E8: 'DYNAMIC_DRAW',
  Stream: 'STREAM_DRAW',
  STREAM_DRAW: 'STREAM_DRAW',
  0x88E0: 'STREAM_DRAW',
})
export type BufferTypeOption =
    'VertexBuffer'
  | 'IndexBuffer'
  | 'ARRAY_BUFFER'
  | 'ELEMENT_ARRAY_BUFFER'
  | number

export const BufferType = Object.freeze({
  VertexBuffer: 0x8892,
  ARRAY_BUFFER: 0x8892,
  0x8892: 0x8892,
  IndexBuffer: 0x8893,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  0x8893: 0x8893,
  nameOf: (name: string|number): string => mapBufferTypeName[name],
})
const mapBufferTypeName = Object.freeze({
  VertexBuffer: 'ARRAY_BUFFER',
  ARRAY_BUFFER: 'ARRAY_BUFFER',
  0x8892: 'ARRAY_BUFFER',
  IndexBuffer: 'ELEMENT_ARRAY_BUFFER',
  ELEMENT_ARRAY_BUFFER: 'ELEMENT_ARRAY_BUFFER',
  0x8893: 'ELEMENT_ARRAY_BUFFER',
})
export type BlendOption =
    'Zero'
  | 'One'
  | 'SrcColor'
  | 'SrcColorInv'
  | 'SrcAlpha'
  | 'SrcAlphaInv'
  | 'SrcAlphaSat'
  | 'DstColor'
  | 'DstColorInv'
  | 'DstAlpha'
  | 'DstAlphaInv'
  | 'ConstantColor'
  | 'ConstantColorInv'
  | 'ConstantAlpha'
  | 'ConstantAlphaInv'
  | 'ZERO'
  | 'ONE'
  | 'SRC_COLOR'
  | 'ONE_MINUS_SRC_COLOR'
  | 'SRC_ALPHA'
  | 'ONE_MINUS_SRC_ALPHA'
  | 'SRC_ALPHA_SATURATE'
  | 'DST_COLOR'
  | 'ONE_MINUS_DST_COLOR'
  | 'DST_ALPHA'
  | 'ONE_MINUS_DST_ALPHA'
  | 'CONSTANT_COLOR'
  | 'ONE_MINUS_CONSTANT_COLOR'
  | 'CONSTANT_ALPHA'
  | 'ONE_MINUS_CONSTANT_ALPHA'
  | number

export const Blend = Object.freeze({
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
  nameOf: (name: string|number): string => mapBlendName[name],
})
const mapBlendName = Object.freeze({
  Zero: 'ZERO',
  ZERO: 'ZERO',
  0: 'ZERO',
  One: 'ONE',
  ONE: 'ONE',
  1: 'ONE',
  SrcColor: 'SRC_COLOR',
  SRC_COLOR: 'SRC_COLOR',
  0x0300: 'SRC_COLOR',
  SrcColorInv: 'ONE_MINUS_SRC_COLOR',
  ONE_MINUS_SRC_COLOR: 'ONE_MINUS_SRC_COLOR',
  0x0301: 'ONE_MINUS_SRC_COLOR',
  SrcAlpha: 'SRC_ALPHA',
  SRC_ALPHA: 'SRC_ALPHA',
  0x0302: 'SRC_ALPHA',
  SrcAlphaInv: 'ONE_MINUS_SRC_ALPHA',
  ONE_MINUS_SRC_ALPHA: 'ONE_MINUS_SRC_ALPHA',
  0x0303: 'ONE_MINUS_SRC_ALPHA',
  SrcAlphaSat: 'SRC_ALPHA_SATURATE',
  SRC_ALPHA_SATURATE: 'SRC_ALPHA_SATURATE',
  0x0308: 'SRC_ALPHA_SATURATE',
  DstColor: 'DST_COLOR',
  DST_COLOR: 'DST_COLOR',
  0x0306: 'DST_COLOR',
  DstColorInv: 'ONE_MINUS_DST_COLOR',
  ONE_MINUS_DST_COLOR: 'ONE_MINUS_DST_COLOR',
  0x0307: 'ONE_MINUS_DST_COLOR',
  DstAlpha: 'DST_ALPHA',
  DST_ALPHA: 'DST_ALPHA',
  0x0304: 'DST_ALPHA',
  DstAlphaInv: 'ONE_MINUS_DST_ALPHA',
  ONE_MINUS_DST_ALPHA: 'ONE_MINUS_DST_ALPHA',
  0x0305: 'ONE_MINUS_DST_ALPHA',
  ConstantColor: 'CONSTANT_COLOR',
  CONSTANT_COLOR: 'CONSTANT_COLOR',
  0x8001: 'CONSTANT_COLOR',
  ConstantColorInv: 'ONE_MINUS_CONSTANT_COLOR',
  ONE_MINUS_CONSTANT_COLOR: 'ONE_MINUS_CONSTANT_COLOR',
  0x8002: 'ONE_MINUS_CONSTANT_COLOR',
  ConstantAlpha: 'CONSTANT_ALPHA',
  CONSTANT_ALPHA: 'CONSTANT_ALPHA',
  0x8003: 'CONSTANT_ALPHA',
  ConstantAlphaInv: 'ONE_MINUS_CONSTANT_ALPHA',
  ONE_MINUS_CONSTANT_ALPHA: 'ONE_MINUS_CONSTANT_ALPHA',
  0x8004: 'ONE_MINUS_CONSTANT_ALPHA',
})
export type BlendFunctionOption =
    'Add'
  | 'Subtract'
  | 'ReverseSubtract'
  | 'FUNC_ADD'
  | 'FUNC_SUBTRACT'
  | 'FUNC_REVERSE_SUBTRACT'
  | number

export const BlendFunction = Object.freeze({
  Add: 0x8006,
  FUNC_ADD: 0x8006,
  0x8006: 0x8006,
  Subtract: 0x800A,
  FUNC_SUBTRACT: 0x800A,
  0x800A: 0x800A,
  ReverseSubtract: 0x800B,
  FUNC_REVERSE_SUBTRACT: 0x800B,
  0x800B: 0x800B,
  nameOf: (name: string|number): string => mapBlendFunctionName[name],
})
const mapBlendFunctionName = Object.freeze({
  Add: 'FUNC_ADD',
  FUNC_ADD: 'FUNC_ADD',
  0x8006: 'FUNC_ADD',
  Subtract: 'FUNC_SUBTRACT',
  FUNC_SUBTRACT: 'FUNC_SUBTRACT',
  0x800A: 'FUNC_SUBTRACT',
  ReverseSubtract: 'FUNC_REVERSE_SUBTRACT',
  FUNC_REVERSE_SUBTRACT: 'FUNC_REVERSE_SUBTRACT',
  0x800B: 'FUNC_REVERSE_SUBTRACT',
})
export type CompareFunctionOption =
    'Never'
  | 'Less'
  | 'Equal'
  | 'LessEqual'
  | 'Greater'
  | 'NotEqual'
  | 'GreaterEqual'
  | 'Always'
  | 'NEVER'
  | 'LESS'
  | 'EQUAL'
  | 'LEQUAL'
  | 'GREATER'
  | 'NOTEQUAL'
  | 'GEQUAL'
  | 'ALWAYS'
  | number

export const CompareFunction = Object.freeze({
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
  nameOf: (name: string|number): string => mapCompareFunctionName[name],
})
const mapCompareFunctionName = Object.freeze({
  Never: 'NEVER',
  NEVER: 'NEVER',
  0x0200: 'NEVER',
  Less: 'LESS',
  LESS: 'LESS',
  0x0201: 'LESS',
  Equal: 'EQUAL',
  EQUAL: 'EQUAL',
  0x0202: 'EQUAL',
  LessEqual: 'LEQUAL',
  LEQUAL: 'LEQUAL',
  0x0203: 'LEQUAL',
  Greater: 'GREATER',
  GREATER: 'GREATER',
  0x0204: 'GREATER',
  NotEqual: 'NOTEQUAL',
  NOTEQUAL: 'NOTEQUAL',
  0x0205: 'NOTEQUAL',
  GreaterEqual: 'GEQUAL',
  GEQUAL: 'GEQUAL',
  0x0206: 'GEQUAL',
  Always: 'ALWAYS',
  ALWAYS: 'ALWAYS',
  0x0207: 'ALWAYS',
})
export type CullModeOption =
    'Front'
  | 'Back'
  | 'FrontAndBack'
  | 'FRONT'
  | 'BACK'
  | 'FRONT_AND_BACK'
  | number

export const CullMode = Object.freeze({
  Front: 0x0404,
  FRONT: 0x0404,
  0x0404: 0x0404,
  Back: 0x0405,
  BACK: 0x0405,
  0x0405: 0x0405,
  FrontAndBack: 0x0408,
  FRONT_AND_BACK: 0x0408,
  0x0408: 0x0408,
  nameOf: (name: string|number): string => mapCullModeName[name],
})
const mapCullModeName = Object.freeze({
  Front: 'FRONT',
  FRONT: 'FRONT',
  0x0404: 'FRONT',
  Back: 'BACK',
  BACK: 'BACK',
  0x0405: 'BACK',
  FrontAndBack: 'FRONT_AND_BACK',
  FRONT_AND_BACK: 'FRONT_AND_BACK',
  0x0408: 'FRONT_AND_BACK',
})
export type FrontFaceOption =
    'ClockWise'
  | 'CounterClockWise'
  | 'CW'
  | 'CCW'
  | number

export const FrontFace = Object.freeze({
  ClockWise: 0x0900,
  CW: 0x0900,
  0x0900: 0x0900,
  CounterClockWise: 0x0901,
  CCW: 0x0901,
  0x0901: 0x0901,
  nameOf: (name: string|number): string => mapFrontFaceName[name],
})
const mapFrontFaceName = Object.freeze({
  ClockWise: 'CW',
  CW: 'CW',
  0x0900: 'CW',
  CounterClockWise: 'CCW',
  CCW: 'CCW',
  0x0901: 'CCW',
})
export type StencilOperationOption =
    'Zero'
  | 'Keep'
  | 'Replace'
  | 'Increment'
  | 'Decrement'
  | 'Invert'
  | 'IncrementWrap'
  | 'DecrementWrap'
  | 'ZERO'
  | 'KEEP'
  | 'REPLACE'
  | 'INCR'
  | 'DECR'
  | 'INVERT'
  | 'INCR_WRAP'
  | 'DECR_WRAP'
  | number

export const StencilOperation = Object.freeze({
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
  nameOf: (name: string|number): string => mapStencilOperationName[name],
})
const mapStencilOperationName = Object.freeze({
  Zero: 'ZERO',
  ZERO: 'ZERO',
  0: 'ZERO',
  Keep: 'KEEP',
  KEEP: 'KEEP',
  0x1E00: 'KEEP',
  Replace: 'REPLACE',
  REPLACE: 'REPLACE',
  0x1E01: 'REPLACE',
  Increment: 'INCR',
  INCR: 'INCR',
  0x1E02: 'INCR',
  Decrement: 'DECR',
  DECR: 'DECR',
  0x1E03: 'DECR',
  Invert: 'INVERT',
  INVERT: 'INVERT',
  0x150A: 'INVERT',
  IncrementWrap: 'INCR_WRAP',
  INCR_WRAP: 'INCR_WRAP',
  0x8507: 'INCR_WRAP',
  DecrementWrap: 'DECR_WRAP',
  DECR_WRAP: 'DECR_WRAP',
  0x8508: 'DECR_WRAP',
})
export type PixelFormatOption =
    'Alpha'
  | 'Luminance'
  | 'LuminanceAlpha'
  | 'RGB'
  | 'RGBA'
  | 'ALPHA'
  | 'LUMINANCE'
  | 'LUMINANCE_ALPHA'
  | 'RGB'
  | 'RGBA'
  | number

export const PixelFormat = Object.freeze({
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
  nameOf: (name: string|number): string => mapPixelFormatName[name],
})
const mapPixelFormatName = Object.freeze({
  Alpha: 'ALPHA',
  ALPHA: 'ALPHA',
  0x1906: 'ALPHA',
  Luminance: 'LUMINANCE',
  LUMINANCE: 'LUMINANCE',
  0x1909: 'LUMINANCE',
  LuminanceAlpha: 'LUMINANCE_ALPHA',
  LUMINANCE_ALPHA: 'LUMINANCE_ALPHA',
  0x190A: 'LUMINANCE_ALPHA',
  RGB: 'RGB',
  0x1907: 'RGB',
  RGBA: 'RGBA',
  0x1908: 'RGBA',
})
export type PixelFormatElementCountOption =
    'Alpha'
  | 'Luminance'
  | 'LuminanceAlpha'
  | 'RGB'
  | 'RGBA'
  | 'ALPHA'
  | 'LUMINANCE'
  | 'LUMINANCE_ALPHA'
  | 'RGB'
  | 'RGBA'
  | number

export const PixelFormatElementCount = Object.freeze({
  Alpha: 1,
  1: 1,
  ALPHA: 1,
  0x1906: 1,
  Luminance: 1,
  LUMINANCE: 1,
  0x1909: 1,
  LuminanceAlpha: 2,
  2: 2,
  LUMINANCE_ALPHA: 2,
  0x190A: 2,
  RGB: 3,
  3: 3,
  0x1907: 3,
  RGBA: 4,
  4: 4,
  0x1908: 4,
})
export type PrimitiveTypeOption =
    'PointList'
  | 'LineList'
  | 'LineStrip'
  | 'TriangleList'
  | 'TriangleStrip'
  | 'TriangleFan'
  | 'POINTS'
  | 'LINES'
  | 'LINE_STRIP'
  | 'TRIANGLES'
  | 'TRIANGLE_STRIP'
  | 'TRIANGLE_FAN'
  | number

export const PrimitiveType = Object.freeze({
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
  nameOf: (name: string|number): string => mapPrimitiveTypeName[name],
})
const mapPrimitiveTypeName = Object.freeze({
  PointList: 'POINTS',
  POINTS: 'POINTS',
  0x0000: 'POINTS',
  LineList: 'LINES',
  LINES: 'LINES',
  0x0001: 'LINES',
  LineStrip: 'LINE_STRIP',
  LINE_STRIP: 'LINE_STRIP',
  0x0003: 'LINE_STRIP',
  TriangleList: 'TRIANGLES',
  TRIANGLES: 'TRIANGLES',
  0x0004: 'TRIANGLES',
  TriangleStrip: 'TRIANGLE_STRIP',
  TRIANGLE_STRIP: 'TRIANGLE_STRIP',
  0x0005: 'TRIANGLE_STRIP',
  TriangleFan: 'TRIANGLE_FAN',
  TRIANGLE_FAN: 'TRIANGLE_FAN',
  0x0006: 'TRIANGLE_FAN',
})
export type TextureTypeOption =
    'Texture'
  | 'Texture2D'
  | 'TextureCube'
  | 'TEXTURE'
  | 'TEXTURE_2D'
  | 'TEXTURE_CUBE_MAP'
  | number

export const TextureType = Object.freeze({
  Texture: 0x1702,
  TEXTURE: 0x1702,
  0x1702: 0x1702,
  Texture2D: 0x0DE1,
  TEXTURE_2D: 0x0DE1,
  0x0DE1: 0x0DE1,
  TextureCube: 0x8513,
  TEXTURE_CUBE_MAP: 0x8513,
  0x8513: 0x8513,
  nameOf: (name: string|number): string => mapTextureTypeName[name],
})
const mapTextureTypeName = Object.freeze({
  Texture: 'TEXTURE',
  TEXTURE: 'TEXTURE',
  0x1702: 'TEXTURE',
  Texture2D: 'TEXTURE_2D',
  TEXTURE_2D: 'TEXTURE_2D',
  0x0DE1: 'TEXTURE_2D',
  TextureCube: 'TEXTURE_CUBE_MAP',
  TEXTURE_CUBE_MAP: 'TEXTURE_CUBE_MAP',
  0x8513: 'TEXTURE_CUBE_MAP',
})
export type TextureWrapModeOption =
    'Repeat'
  | 'Clamp'
  | 'Mirror'
  | 'REPEAT'
  | 'CLAMP_TO_EDGE'
  | 'MIRRORED_REPEAT'
  | number

export const TextureWrapMode = Object.freeze({
  Repeat: 0x2901,
  REPEAT: 0x2901,
  0x2901: 0x2901,
  Clamp: 0x812F,
  CLAMP_TO_EDGE: 0x812F,
  0x812F: 0x812F,
  Mirror: 0x8370,
  MIRRORED_REPEAT: 0x8370,
  0x8370: 0x8370,
  nameOf: (name: string|number): string => mapTextureWrapModeName[name],
})
const mapTextureWrapModeName = Object.freeze({
  Repeat: 'REPEAT',
  REPEAT: 'REPEAT',
  0x2901: 'REPEAT',
  Clamp: 'CLAMP_TO_EDGE',
  CLAMP_TO_EDGE: 'CLAMP_TO_EDGE',
  0x812F: 'CLAMP_TO_EDGE',
  Mirror: 'MIRRORED_REPEAT',
  MIRRORED_REPEAT: 'MIRRORED_REPEAT',
  0x8370: 'MIRRORED_REPEAT',
})
export type TextureFilterOption =
    'Point'
  | 'Linear'
  | 'PointMipPoint'
  | 'LinearMipPoint'
  | 'PointMipLinear'
  | 'LinearMipLinear'
  | 'NEAREST'
  | 'LINEAR'
  | 'NEAREST_MIPMAP_NEAREST'
  | 'LINEAR_MIPMAP_NEAREST'
  | 'NEAREST_MIPMAP_LINEAR'
  | 'LINEAR_MIPMAP_LINEAR'
  | number

export const TextureFilter = Object.freeze({
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
  nameOf: (name: string|number): string => mapTextureFilterName[name],
})
const mapTextureFilterName = Object.freeze({
  Point: 'NEAREST',
  NEAREST: 'NEAREST',
  0x2600: 'NEAREST',
  Linear: 'LINEAR',
  LINEAR: 'LINEAR',
  0x2601: 'LINEAR',
  PointMipPoint: 'NEAREST_MIPMAP_NEAREST',
  NEAREST_MIPMAP_NEAREST: 'NEAREST_MIPMAP_NEAREST',
  0x2700: 'NEAREST_MIPMAP_NEAREST',
  LinearMipPoint: 'LINEAR_MIPMAP_NEAREST',
  LINEAR_MIPMAP_NEAREST: 'LINEAR_MIPMAP_NEAREST',
  0x2701: 'LINEAR_MIPMAP_NEAREST',
  PointMipLinear: 'NEAREST_MIPMAP_LINEAR',
  NEAREST_MIPMAP_LINEAR: 'NEAREST_MIPMAP_LINEAR',
  0x2702: 'NEAREST_MIPMAP_LINEAR',
  LinearMipLinear: 'LINEAR_MIPMAP_LINEAR',
  LINEAR_MIPMAP_LINEAR: 'LINEAR_MIPMAP_LINEAR',
  0x2703: 'LINEAR_MIPMAP_LINEAR',
})
export type ShaderTypeOption =
    'VertexShader'
  | 'FragmentShader'
  | 'VERTEX_SHADER'
  | 'FRAGMENT_SHADER'
  | number

export const ShaderType = Object.freeze({
  VertexShader: 0x8B31,
  VERTEX_SHADER: 0x8B31,
  0x8B31: 0x8B31,
  FragmentShader: 0x8B30,
  FRAGMENT_SHADER: 0x8B30,
  0x8B30: 0x8B30,
  nameOf: (name: string|number): string => mapShaderTypeName[name],
})
const mapShaderTypeName = Object.freeze({
  VertexShader: 'VERTEX_SHADER',
  VERTEX_SHADER: 'VERTEX_SHADER',
  0x8B31: 'VERTEX_SHADER',
  FragmentShader: 'FRAGMENT_SHADER',
  FRAGMENT_SHADER: 'FRAGMENT_SHADER',
  0x8B30: 'FRAGMENT_SHADER',
})
export type DepthFormatOption =
    'None'
  | 'DepthStencil'
  | 'Depth16'
  | 'Depth24'
  | 'Depth32'
  | 'Depth24Stencil8'
  | 'Depth32Stencil8'
  | 'ZERO'
  | 'DEPTH_STENCIL'
  | 'DEPTH_COMPONENT16'
  | 'DEPTH_COMPONENT24'
  | 'DEPTH_COMPONENT32F'
  | 'DEPTH24_STENCIL8'
  | 'DEPTH32F_STENCIL8'
  | number

export const DepthFormat = Object.freeze({
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
  nameOf: (name: string|number): string => mapDepthFormatName[name],
})
const mapDepthFormatName = Object.freeze({
  None: 'ZERO',
  ZERO: 'ZERO',
  0: 'ZERO',
  DepthStencil: 'DEPTH_STENCIL',
  DEPTH_STENCIL: 'DEPTH_STENCIL',
  0x84F9: 'DEPTH_STENCIL',
  Depth16: 'DEPTH_COMPONENT16',
  DEPTH_COMPONENT16: 'DEPTH_COMPONENT16',
  0x81A5: 'DEPTH_COMPONENT16',
  Depth24: 'DEPTH_COMPONENT24',
  DEPTH_COMPONENT24: 'DEPTH_COMPONENT24',
  0x81A6: 'DEPTH_COMPONENT24',
  Depth32: 'DEPTH_COMPONENT32F',
  DEPTH_COMPONENT32F: 'DEPTH_COMPONENT32F',
  0x8CAC: 'DEPTH_COMPONENT32F',
  Depth24Stencil8: 'DEPTH24_STENCIL8',
  DEPTH24_STENCIL8: 'DEPTH24_STENCIL8',
  0x88F0: 'DEPTH24_STENCIL8',
  Depth32Stencil8: 'DEPTH32F_STENCIL8',
  DEPTH32F_STENCIL8: 'DEPTH32F_STENCIL8',
  0x8CAD: 'DEPTH32F_STENCIL8',
})
export type StencilFormatOption =
    'Stencil8'
  | 'STENCIL_INDEX8'
  | number

export const StencilFormat = Object.freeze({
  Stencil8: 0x8D48,
  STENCIL_INDEX8: 0x8D48,
  0x8D48: 0x8D48,
  nameOf: (name: string|number): string => mapStencilFormatName[name],
})
const mapStencilFormatName = Object.freeze({
  Stencil8: 'STENCIL_INDEX8',
  STENCIL_INDEX8: 'STENCIL_INDEX8',
  0x8D48: 'STENCIL_INDEX8',
})
export type LightTypeOption =
    'None'
  | 'Directional'
  | 'Point'
  | 'Spot'
  | 'Box'
  | number

export const LightType = Object.freeze({
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

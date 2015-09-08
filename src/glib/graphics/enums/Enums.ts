module Glib.Graphics {
  export var DataType = {
    byte : 0x1400,
  int8 : 0x1400,
  BYTE : 0x1400,
  0x1400 : 0x1400,
  short : 0x1402,
  int16 : 0x1402,
  SHORT : 0x1402,
  0x1402 : 0x1402,
  int : 0x1404,
  int32 : 0x1404,
  INT : 0x1404,
  0x1404 : 0x1404,
  ubyte : 0x1401,
  uint8 : 0x1401,
  UNSIGNED_BYTE : 0x1401,
  0x1401 : 0x1401,
  ushort : 0x1403,
  uint16 : 0x1403,
  UNSIGNED_SHORT : 0x1403,
  0x1403 : 0x1403,
  uint : 0x1405,
  uint32 : 0x1405,
  UNSIGNED_INT : 0x1405,
  0x1405 : 0x1405,
  float : 0x1406,
  float32 : 0x1406,
  FLOAT : 0x1406,
  0x1406 : 0x1406,
  ushort565 : 0x8363,
  UNSIGNED_SHORT_5_6_5 : 0x8363,
  0x8363 : 0x8363,
  ushort4444 : 0x8033,
  UNSIGNED_SHORT_4_4_4_4 : 0x8033,
  0x8033 : 0x8033,
  ushort5551 : 0x8034,
  UNSIGNED_SHORT_5_5_5_1 : 0x8034,
  0x8034 : 0x8034
  };
}

module Glib.Graphics {
  export var DataTypeName = {
    byte : 'BYTE',
  int8 : 'BYTE',
  0x1400 : 'BYTE',
  short : 'SHORT',
  int16 : 'SHORT',
  0x1402 : 'SHORT',
  int : 'INT',
  int32 : 'INT',
  0x1404 : 'INT',
  ubyte : 'UNSIGNED_BYTE',
  uint8 : 'UNSIGNED_BYTE',
  0x1401 : 'UNSIGNED_BYTE',
  ushort : 'UNSIGNED_SHORT',
  uint16 : 'UNSIGNED_SHORT',
  0x1403 : 'UNSIGNED_SHORT',
  uint : 'UNSIGNED_INT',
  uint32 : 'UNSIGNED_INT',
  0x1405 : 'UNSIGNED_INT',
  float : 'FLOAT',
  float32 : 'FLOAT',
  0x1406 : 'FLOAT',
  ushort565 : 'UNSIGNED_SHORT_5_6_5',
  0x8363 : 'UNSIGNED_SHORT_5_6_5',
  ushort4444 : 'UNSIGNED_SHORT_4_4_4_4',
  0x8033 : 'UNSIGNED_SHORT_4_4_4_4',
  ushort5551 : 'UNSIGNED_SHORT_5_5_5_1',
  0x8034 : 'UNSIGNED_SHORT_5_5_5_1'
  };
}

module Glib.Graphics {
  export var DataSize = {
    byte : 1,
  int8 : 1,
  BYTE : 1,
  0x1400 : 1,
  short : 2,
  int16 : 2,
  SHORT : 2,
  0x1402 : 2,
  int : 4,
  int32 : 4,
  INT : 4,
  0x1404 : 4,
  ubyte : 1,
  uint8 : 1,
  UNSIGNED_BYTE : 1,
  0x1401 : 1,
  ushort : 2,
  uint16 : 2,
  UNSIGNED_SHORT : 2,
  0x1403 : 2,
  uint : 4,
  uint32 : 4,
  UNSIGNED_INT : 4,
  0x1405 : 4,
  float : 4,
  float32 : 4,
  FLOAT : 4,
  0x1406 : 4,
  ushort565 : 2,
  UNSIGNED_SHORT_5_6_5 : 2,
  0x8363 : 2,
  ushort4444 : 2,
  UNSIGNED_SHORT_4_4_4_4 : 2,
  0x8033 : 2,
  ushort5551 : 2,
  UNSIGNED_SHORT_5_5_5_1 : 2,
  0x8034 : 2
  };
}

module Glib.Graphics {
  export var ArrayType = {
    byte : Int8Array,
  int8 : Int8Array,
  BYTE : Int8Array,
  0x1400 : Int8Array,
  short : Int16Array,
  int16 : Int16Array,
  SHORT : Int16Array,
  0x1402 : Int16Array,
  int : Int32Array,
  int32 : Int32Array,
  INT : Int32Array,
  0x1404 : Int32Array,
  ubyte : Uint8Array,
  uint8 : Uint8Array,
  UNSIGNED_BYTE : Uint8Array,
  0x1401 : Uint8Array,
  ushort : Uint16Array,
  uint16 : Uint16Array,
  UNSIGNED_SHORT : Uint16Array,
  0x1403 : Uint16Array,
  uint : Uint32Array,
  uint32 : Uint32Array,
  UNSIGNED_INT : Uint32Array,
  0x1405 : Uint32Array,
  float : Float32Array,
  float32 : Float32Array,
  FLOAT : Float32Array,
  0x1406 : Float32Array,
  ushort565 : Uint16Array,
  UNSIGNED_SHORT_5_6_5 : Uint16Array,
  0x8363 : Uint16Array,
  ushort4444 : Uint16Array,
  UNSIGNED_SHORT_4_4_4_4 : Uint16Array,
  0x8033 : Uint16Array,
  ushort5551 : Uint16Array,
  UNSIGNED_SHORT_5_5_5_1 : Uint16Array,
  0x8034 : Uint16Array
  };
}

module Glib.Graphics {
  export var ArrayTypeName = {
    byte : 'Int8Array',
  int8 : 'Int8Array',
  short : 'Int16Array',
  int16 : 'Int16Array',
  int : 'Int32Array',
  int32 : 'Int32Array',
  ubyte : 'Uint8Array',
  uint8 : 'Uint8Array',
  ushort : 'Uint16Array',
  uint16 : 'Uint16Array',
  uint : 'Uint32Array',
  uint32 : 'Uint32Array',
  float : 'Float32Array',
  float32 : 'Float32Array',
  ushort565 : 'Uint16Array',
  ushort4444 : 'Uint16Array',
  ushort5551 : 'Uint16Array'
  };
}

module Glib.Graphics {
  export var BufferUsage = {
    Static : 0x88E4,
  0x88E4 : 0x88E4,
  Dynamic : 0x88E8,
  0x88E8 : 0x88E8,
  Stream : 0x88E0,
  0x88E0 : 0x88E0
  };
}

module Glib.Graphics {
  export var BufferUsageName = {
    Static : 'STATIC_DRAW',
  0x88E4 : 'STATIC_DRAW',
  Dynamic : 'DYNAMIC_DRAW',
  0x88E8 : 'DYNAMIC_DRAW',
  Stream : 'STREAM_DRAW',
  0x88E0 : 'STREAM_DRAW'
  };
}

module Glib.Graphics {
  export var BufferType = {
    VertexBuffer : 0x8892,
  0x8892 : 0x8892,
  IndexBuffer : 0x8893,
  0x8893 : 0x8893
  };
}

module Glib.Graphics {
  export var BufferTypeName = {
    VertexBuffer : 'ARRAY_BUFFER',
  0x8892 : 'ARRAY_BUFFER',
  IndexBuffer : 'ELEMENT_ARRAY_BUFFER',
  0x8893 : 'ELEMENT_ARRAY_BUFFER'
  };
}

module Glib.Graphics {
  export var Blend = {
    Zero : 0,
  0 : 0,
  One : 1,
  1 : 1,
  SrcColor : 0x0300,
  0x0300 : 0x0300,
  SrcColorInv : 0x0301,
  0x0301 : 0x0301,
  SrcAlpha : 0x0302,
  0x0302 : 0x0302,
  SrcAlphaInv : 0x0303,
  0x0303 : 0x0303,
  SrcAlphaSat : 0x0308,
  0x0308 : 0x0308,
  DstColor : 0x0306,
  0x0306 : 0x0306,
  DstColorInv : 0x0307,
  0x0307 : 0x0307,
  DstAlpha : 0x0304,
  0x0304 : 0x0304,
  DstAlphaInv : 0x0305,
  0x0305 : 0x0305,
  ConstantColor : 0x8001,
  0x8001 : 0x8001,
  ConstantColorInv : 0x8002,
  0x8002 : 0x8002,
  ConstantAlpha : 0x8003,
  0x8003 : 0x8003,
  ConstantAlphaInv : 0x8004,
  0x8004 : 0x8004
  };
}

module Glib.Graphics {
  export var BlendName = {
    Zero : 'ZERO',
  0 : 'ZERO',
  One : 'ONE',
  1 : 'ONE',
  SrcColor : 'SRC_COLOR',
  0x0300 : 'SRC_COLOR',
  SrcColorInv : 'ONE_MINUS_SRC_COLOR',
  0x0301 : 'ONE_MINUS_SRC_COLOR',
  SrcAlpha : 'SRC_ALPHA',
  0x0302 : 'SRC_ALPHA',
  SrcAlphaInv : 'ONE_MINUS_SRC_ALPHA',
  0x0303 : 'ONE_MINUS_SRC_ALPHA',
  SrcAlphaSat : 'SRC_ALPHA_SATURATE',
  0x0308 : 'SRC_ALPHA_SATURATE',
  DstColor : 'DST_COLOR',
  0x0306 : 'DST_COLOR',
  DstColorInv : 'ONE_MINUS_DST_COLOR',
  0x0307 : 'ONE_MINUS_DST_COLOR',
  DstAlpha : 'DST_ALPHA',
  0x0304 : 'DST_ALPHA',
  DstAlphaInv : 'ONE_MINUS_DST_ALPHA',
  0x0305 : 'ONE_MINUS_DST_ALPHA',
  ConstantColor : 'CONSTANT_COLOR',
  0x8001 : 'CONSTANT_COLOR',
  ConstantColorInv : 'ONE_MINUS_CONSTANT_COLOR',
  0x8002 : 'ONE_MINUS_CONSTANT_COLOR',
  ConstantAlpha : 'CONSTANT_ALPHA',
  0x8003 : 'CONSTANT_ALPHA',
  ConstantAlphaInv : 'ONE_MINUS_CONSTANT_ALPHA',
  0x8004 : 'ONE_MINUS_CONSTANT_ALPHA'
  };
}

module Glib.Graphics {
  export var BlendFunction = {
    Add : 0x8006,
  0x8006 : 0x8006,
  Subtract : 0x800A,
  0x800A : 0x800A,
  ReverseSubtract : 0x800B,
  0x800B : 0x800B
  };
}

module Glib.Graphics {
  export var BlendFunctionName = {
    Add : 'FUNC_ADD',
  0x8006 : 'FUNC_ADD',
  Subtract : 'FUNC_SUBTRACT',
  0x800A : 'FUNC_SUBTRACT',
  ReverseSubtract : 'FUNC_REVERSE_SUBTRACT',
  0x800B : 'FUNC_REVERSE_SUBTRACT'
  };
}

module Glib.Graphics {
  export var CompareFunction = {
    Never : 0x0200,
  0x0200 : 0x0200,
  Less : 0x0201,
  0x0201 : 0x0201,
  Equal : 0x0202,
  0x0202 : 0x0202,
  LessEqual : 0x0203,
  0x0203 : 0x0203,
  Greater : 0x0204,
  0x0204 : 0x0204,
  NotEqual : 0x0205,
  0x0205 : 0x0205,
  GreaterEqual : 0x0206,
  0x0206 : 0x0206,
  Always : 0x0207,
  0x0207 : 0x0207
  };
}

module Glib.Graphics {
  export var CompareFunctionName = {
    Never : 'NEVER',
  0x0200 : 'NEVER',
  Less : 'LESS',
  0x0201 : 'LESS',
  Equal : 'EQUAL',
  0x0202 : 'EQUAL',
  LessEqual : 'LEQUAL',
  0x0203 : 'LEQUAL',
  Greater : 'GREATER',
  0x0204 : 'GREATER',
  NotEqual : 'NOTEQUAL',
  0x0205 : 'NOTEQUAL',
  GreaterEqual : 'GEQUAL',
  0x0206 : 'GEQUAL',
  Always : 'ALWAYS',
  0x0207 : 'ALWAYS'
  };
}

module Glib.Graphics {
  export var CullMode = {
    Front : 0x0404,
  0x0404 : 0x0404,
  Back : 0x0405,
  0x0405 : 0x0405,
  FrontAndBack : 0x0408,
  0x0408 : 0x0408
  };
}

module Glib.Graphics {
  export var CullModeName = {
    Front : 'FRONT',
  0x0404 : 'FRONT',
  Back : 'BACK',
  0x0405 : 'BACK',
  FrontAndBack : 'FRONT_AND_BACK',
  0x0408 : 'FRONT_AND_BACK'
  };
}

module Glib.Graphics {
  export var FrontFace = {
    ClockWise : 0x0900,
  0x0900 : 0x0900,
  CounterClockWise : 0x0901,
  0x0901 : 0x0901
  };
}

module Glib.Graphics {
  export var FrontFaceName = {
    ClockWise : 'CW',
  0x0900 : 'CW',
  CounterClockWise : 'CCW',
  0x0901 : 'CCW'
  };
}

module Glib.Graphics {
  export var StencilOperation = {
    Zero : 0,
  0 : 0,
  Keep : 0x1E00,
  0x1E00 : 0x1E00,
  Replace : 0x1E01,
  0x1E01 : 0x1E01,
  Increment : 0x1E02,
  0x1E02 : 0x1E02,
  Decrement : 0x1E03,
  0x1E03 : 0x1E03,
  Invert : 0x150A,
  0x150A : 0x150A,
  IncrementWrap : 0x8507,
  0x8507 : 0x8507,
  DecrementWrap : 0x8508,
  0x8508 : 0x8508
  };
}

module Glib.Graphics {
  export var StencilOperationName = {
    Zero : 'ZERO',
  0 : 'ZERO',
  Keep : 'KEEP',
  0x1E00 : 'KEEP',
  Replace : 'REPLACE',
  0x1E01 : 'REPLACE',
  Increment : 'INCR',
  0x1E02 : 'INCR',
  Decrement : 'DECR',
  0x1E03 : 'DECR',
  Invert : 'INVERT',
  0x150A : 'INVERT',
  IncrementWrap : 'INCR_WRAP',
  0x8507 : 'INCR_WRAP',
  DecrementWrap : 'DECR_WRAP',
  0x8508 : 'DECR_WRAP'
  };
}

module Glib.Graphics {
  export var PixelFormat = {
    Alpha : 0x1906,
  0x1906 : 0x1906,
  Luminance : 0x1909,
  0x1909 : 0x1909,
  LuminanceAlpha : 0x190A,
  0x190A : 0x190A,
  RGB : 0x1907,
  0x1907 : 0x1907,
  RGBA : 0x1908,
  0x1908 : 0x1908
  };
}

module Glib.Graphics {
  export var PixelFormatName = {
    Alpha : 'ALPHA',
  0x1906 : 'ALPHA',
  Luminance : 'LUMINANCE',
  0x1909 : 'LUMINANCE',
  LuminanceAlpha : 'LUMINANCE_ALPHA',
  0x190A : 'LUMINANCE_ALPHA',
  RGB : 'RGB',
  0x1907 : 'RGB',
  RGBA : 'RGBA',
  0x1908 : 'RGBA'
  };
}

module Glib.Graphics {
  export var PixelFormatElementCount = {
    Alpha : 1,
  ALPHA : 1,
  0x1906 : 1,
  Luminance : 1,
  LUMINANCE : 1,
  0x1909 : 1,
  LuminanceAlpha : 2,
  LUMINANCE_ALPHA : 2,
  0x190A : 2,
  RGB : 3,
  0x1907 : 3,
  RGBA : 4,
  0x1908 : 4
  };
}

module Glib.Graphics {
  export var PrimitiveType = {
    PointList : 0x0000,
  0x0000 : 0x0000,
  LineList : 0x0001,
  0x0001 : 0x0001,
  LineStrip : 0x0003,
  0x0003 : 0x0003,
  TriangleList : 0x0004,
  0x0004 : 0x0004,
  TriangleStrip : 0x0005,
  0x0005 : 0x0005,
  TriangleFan : 0x0006,
  0x0006 : 0x0006
  };
}

module Glib.Graphics {
  export var PrimitiveTypeName = {
    PointList : 'POINTS',
  0x0000 : 'POINTS',
  LineList : 'LINES',
  0x0001 : 'LINES',
  LineStrip : 'LINE_STRIP',
  0x0003 : 'LINE_STRIP',
  TriangleList : 'TRIANGLES',
  0x0004 : 'TRIANGLES',
  TriangleStrip : 'TRIANGLE_STRIP',
  0x0005 : 'TRIANGLE_STRIP',
  TriangleFan : 'TRIANGLE_FAN',
  0x0006 : 'TRIANGLE_FAN'
  };
}

module Glib.Graphics {
  export var TextureType = {
    Texture : 0x1702,
  0x1702 : 0x1702,
  Texture2D : 0x0DE1,
  0x0DE1 : 0x0DE1,
  TextureCube : 0x8513,
  0x8513 : 0x8513
  };
}

module Glib.Graphics {
  export var TextureTypeName = {
    Texture : 'TEXTURE',
  0x1702 : 'TEXTURE',
  Texture2D : 'TEXTURE_2D',
  0x0DE1 : 'TEXTURE_2D',
  TextureCube : 'TEXTURE_CUBE_MAP',
  0x8513 : 'TEXTURE_CUBE_MAP'
  };
}

module Glib.Graphics {
  export var TextureWrapMode = {
    Repeat : 0x2901,
  0x2901 : 0x2901,
  Clamp : 0x812F,
  0x812F : 0x812F,
  Mirror : 0x8370,
  0x8370 : 0x8370
  };
}

module Glib.Graphics {
  export var TextureWrapModeName = {
    Repeat : 'REPEAT',
  0x2901 : 'REPEAT',
  Clamp : 'CLAMP_TO_EDGE',
  0x812F : 'CLAMP_TO_EDGE',
  Mirror : 'MIRRORED_REPEAT',
  0x8370 : 'MIRRORED_REPEAT'
  };
}

module Glib.Graphics {
  export var TextureFilter = {
    Point : 0x2600,
  0x2600 : 0x2600,
  Linear : 0x2601,
  0x2601 : 0x2601,
  PointMipPoint : 0x2700,
  0x2700 : 0x2700,
  LinearMipPoint : 0x2701,
  0x2701 : 0x2701,
  PointMipLinear : 0x2702,
  0x2702 : 0x2702,
  LinearMipLinear : 0x2703,
  0x2703 : 0x2703
  };
}

module Glib.Graphics {
  export var TextureFilterName = {
    Point : 'NEAREST',
  0x2600 : 'NEAREST',
  Linear : 'LINEAR',
  0x2601 : 'LINEAR',
  PointMipPoint : 'NEAREST_MIPMAP_NEAREST',
  0x2700 : 'NEAREST_MIPMAP_NEAREST',
  LinearMipPoint : 'LINEAR_MIPMAP_NEAREST',
  0x2701 : 'LINEAR_MIPMAP_NEAREST',
  PointMipLinear : 'NEAREST_MIPMAP_LINEAR',
  0x2702 : 'NEAREST_MIPMAP_LINEAR',
  LinearMipLinear : 'LINEAR_MIPMAP_LINEAR',
  0x2703 : 'LINEAR_MIPMAP_LINEAR'
  };
}

module Glib.Graphics {
  export var ShaderType = {
    VertexShader : 0x8B31,
  0x8B31 : 0x8B31,
  FragmentShader : 0x8B30,
  0x8B30 : 0x8B30
  };
}

module Glib.Graphics {
  export var ShaderTypeName = {
    VertexShader : 'VERTEX_SHADER',
  0x8B31 : 'VERTEX_SHADER',
  FragmentShader : 'FRAGMENT_SHADER',
  0x8B30 : 'FRAGMENT_SHADER'
  };
}

module Glib.Graphics {
  export var DepthFormat = {
    None : 0,
  0 : 0,
  DepthStencil : 0x84F9,
  0x84F9 : 0x84F9,
  Depth16 : 0x81A5,
  0x81A5 : 0x81A5,
  Depth24 : 0x81A6,
  0x81A6 : 0x81A6,
  Depth32 : 0x8CAC,
  0x8CAC : 0x8CAC,
  Depth24Stencil8 : 0x88F0,
  0x88F0 : 0x88F0,
  Depth32Stencil8 : 0x8CAD,
  0x8CAD : 0x8CAD
  };
}

module Glib.Graphics {
  export var DepthFormatName = {
    None : 'ZERO',
  0 : 'ZERO',
  DepthStencil : 'DEPTH_STENCIL',
  0x84F9 : 'DEPTH_STENCIL',
  Depth16 : 'DEPTH_COMPONENT16',
  0x81A5 : 'DEPTH_COMPONENT16',
  Depth24 : 'DEPTH_COMPONENT24',
  0x81A6 : 'DEPTH_COMPONENT24',
  Depth32 : 'DEPTH_COMPONENT32F',
  0x8CAC : 'DEPTH_COMPONENT32F',
  Depth24Stencil8 : 'DEPTH24_STENCIL8',
  0x88F0 : 'DEPTH24_STENCIL8',
  Depth32Stencil8 : 'DEPTH32F_STENCIL8',
  0x8CAD : 'DEPTH32F_STENCIL8'
  };
}

module Glib.Graphics {
  export var StencilFormat = {
    Stencil8 : 0x8D48,
  0x8D48 : 0x8D48
  };
}

module Glib.Graphics {
  export var StencilFormatName = {
    Stencil8 : 'STENCIL_INDEX8',
  0x8D48 : 'STENCIL_INDEX8'
  };
}

module Glib.Graphics {
  export var LightType = {
    None : 0,
  Directional : 1,
  Point : 2,
  Spot : 3,
  Box : 4
  };
}

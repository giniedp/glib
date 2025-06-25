import { DataType, dataTypeToWebGL } from './DataType'
import { GLConst as gl } from './GLConst'

export type SurfaceFormat =
  // 8-bit formats
  | 'R8_UNORM'
  | 'R8_SNORM'
  | 'R8_UINT'
  | 'R8_SINT'
  // 16-bit formats
  | 'R16_UNORM'
  | 'R16_SNORM'
  | 'R16_UINT'
  | 'R16_SINT'
  | 'R16_FLOAT'
  | 'RG8_UNORM'
  | 'RG8_SNORM'
  | 'RG8_UINT'
  | 'RG8_SINT'
  // 32-bit formats
  | 'R32_UINT'
  | 'R32_SINT'
  | 'R32_FLOAT'
  | 'RG16_UNORM'
  | 'RG16_SNORM'
  | 'RG16_UINT'
  | 'RG16_SINT'
  | 'RG16_FLOAT'
  | 'RGBA8_UNORM'
  | 'RGBA8_UNORM_SRGB'
  | 'RGBA8_SNORM'
  | 'RGBA8_UINT'
  | 'RGBA8_SINT'
  | 'BGRA8_UNORM'
  | 'BGRA8_UNORM_SRGB'
  // Packed 32-bit formats
  | 'RGB9_E5_UFLOAT'
  | 'RGB10_A2_UINT'
  | 'RGB10_A2_UNORM'
  | 'RG11_B10_UFLOAT'
  // 64-bit formats
  | 'RG32_UINT'
  | 'RG32_SINT'
  | 'RG32_FLOAT'
  | 'RGBA16_UNORM'
  | 'RGBA16_SNORM'
  | 'RGBA16_UINT'
  | 'RGBA16_SINT'
  | 'RGBA16_FLOAT'
  // 128-bit formats
  | 'RGBA32_UINT'
  | 'RGBA32_SINT'
  | 'RGBA32_FLOAT'
  // Depth/stencil formats
  | 'STENCIL8'
  | 'DEPTH16_UNORM'
  | 'DEPTH24_PLUS'
  | 'DEPTH24_PLUS_STENCIL8'
  | 'DEPTH32_FLOAT'
  | 'DEPTH32_FLOAT_STENCIL8'
  // BC
  | 'BC1_RGBA_UNORM'
  | 'BC2_RGBA_UNORM'
  | 'BC3_RGBA_UNORM'
  | 'BC1_RGBA_UNORM_SRGB'
  | 'BC2_RGBA_UNORM_SRGB'
  | 'BC3_RGBA_UNORM_SRGB'
  | 'BC4_R_UNORM'
  | 'BC4_R_SNORM'
  | 'BC5_RG_UNORM'
  | 'BC5_RG_SNORM'
  | 'BC6H_RGB_UFLOAT'
  | 'BC6H_RGB_FLOAT'
  | 'BC7_RGBA_UNORM'
  | 'BC7_RGBA_UNORM_SRGB'
  // ETC2
  | 'EAC_R11_UNORM'
  | 'EAC_R11_SNORM'
  | 'EAC_RG11_UNORM'
  | 'EAC_RG11_SNORM'
  | 'ETC2_RGB8_UNORM'
  | 'ETC2_RGB8_UNORM_SRGB'
  | 'ETC2_RGB8_A1_UNORM'
  | 'ETC2_RGB8_A1_UNORM_SRGB'
  | 'ETC2_RGBA8_UNORM'
  | 'ETC2_RGBA8_UNORM_SRGB'
  // ASTC
  | 'ASTC_4x4_UNORM'
  | 'ASTC_4x4_UNORM_SRGB'
  | 'ASTC_5x4_UNORM'
  | 'ASTC_5x4_UNORM_SRGB'
  | 'ASTC_5x5_UNORM'
  | 'ASTC_5x5_UNORM_SRGB'
  | 'ASTC_6x5_UNORM'
  | 'ASTC_6x5_UNORM_SRGB'
  | 'ASTC_6x6_UNORM'
  | 'ASTC_6x6_UNORM_SRGB'
  | 'ASTC_8x5_UNORM'
  | 'ASTC_8x5_UNORM_SRGB'
  | 'ASTC_8x6_UNORM'
  | 'ASTC_8x6_UNORM_SRGB'
  | 'ASTC_8x8_UNORM'
  | 'ASTC_8x8_UNORM_SRGB'
  | 'ASTC_10x5_UNORM'
  | 'ASTC_10x5_UNORM_SRGB'
  | 'ASTC_10x6_UNORM'
  | 'ASTC_10x6_UNORM_SRGB'
  | 'ASTC_10x8_UNORM'
  | 'ASTC_10x8_UNORM_SRGB'
  | 'ASTC_10x10_UNORM'
  | 'ASTC_10x10_UNORM_SRGB'
  | 'ASTC_12x10_UNORM'
  | 'ASTC_12x10_UNORM_SRGB'
  | 'ASTC_12x12_UNORM'
  | 'ASTC_12x12_UNORM_SRGB'

export function surfaceFormatIsCompressed(format: SurfaceFormat): boolean {
  return mapToCompressed[format]
}

export function surfaceFormatIsSrgb(format: SurfaceFormat): boolean {
  return mapToSRGB[format]
}

export function surfaceFormatDataType(format: SurfaceFormat): DataType | null {
  return mapToDataType[format] || null
}

export function surfaceFormatToWebGL(format: SurfaceFormat): number {
  return mapToWebGL[format]
}

export function surfaceFormatToWebGLDataType(format: SurfaceFormat): GLenum {
  const type = surfaceFormatDataType(format)
  return dataTypeToWebGL(type)
}

export function surfaceFormatToWebGLFormat(format: SurfaceFormat): GLenum | null {
  return mapToWebGLFormat[format] || null
}

export function surfaceFormatToWebGPU(format: SurfaceFormat): GPUTextureFormat {
  return mapToWebGPU[format]
}

export function surfaceFormatFromDXGI(format: number): SurfaceFormat | null {
  return mapFromDXGI[format] || null
}

export function surfaceFormatFromVulkan(format: number): SurfaceFormat | null {
  return mapFromVulkan[format] || null
}

export function surfaceFormatToWebGLExtension(format: SurfaceFormat) {
  const glFormat = surfaceFormatToWebGL(format)
  return mapToWebGLExtension[glFormat] || null
}

// https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_s3tc/
const enum WEBGL_compressed_texture_s3tc {
  COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83f0,
  COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83f1,
  COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83f2,
  COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83f3,
}

// https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_s3tc_srgb/
const enum WEBGL_compressed_texture_s3tc_srgb {
  COMPRESSED_SRGB_S3TC_DXT1_EXT = 0x8c4c,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = 0x8c4d,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = 0x8c4e,
  COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 0x8c4f,
}

// https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_pvrtc/
const enum WEBGL_compressed_texture_pvrtc {
  COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8c00,
  COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8c01,
  COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8c02,
  COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8c03,
}

// https://registry.khronos.org/webgl/extensions/EXT_texture_compression_bptc/
const enum EXT_texture_compression_bptc {
  COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8e8c,
  COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT = 0x8e8d,
  COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT = 0x8e8e,
  COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT = 0x8e8f,
}

// https://registry.khronos.org/webgl/extensions/EXT_texture_compression_rgtc/
const enum EXT_texture_compression_rgtc {
  COMPRESSED_RED_RGTC1_EXT = 0x8dbb,
  COMPRESSED_SIGNED_RED_RGTC1_EXT = 0x8dbc,
  COMPRESSED_RED_GREEN_RGTC2_EXT = 0x8dbd,
  COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT = 0x8dbe,
}

// https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_etc1/
const enum WEBGL_compressed_texture_etc1 {
  COMPRESSED_RGB_ETC1_WEBGL = 0x8d64,
}

// https://registry.khronos.org/OpenGL/extensions/EXT/EXT_texture_format_BGRA8888.txt
// not shipped yet
const enum EXT_texture_format_BGRA8888 {
  BGRA_EXT = 0x80e1,
  BGRA8_EXT = 0x93a1,
}

// https://registry.khronos.org/webgl/extensions/EXT_texture_norm16/
const enum EXT_texture_norm16 {
  R16_EXT = 0x822a,
  RG16_EXT = 0x822c,
  RGB16_EXT = 0x8054,
  RGBA16_EXT = 0x805b,
  R16_SNORM_EXT = 0x8f98,
  RG16_SNORM_EXT = 0x8f99,
  RGB16_SNORM_EXT = 0x8f9a,
  RGBA16_SNORM_EXT = 0x8f9b,
}

// https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_etc/
const enum WEBGL_compressed_texture_etc {
  COMPRESSED_R11_EAC = 0x9270,
  COMPRESSED_SIGNED_R11_EAC = 0x9271,
  COMPRESSED_RG11_EAC = 0x9272,
  COMPRESSED_SIGNED_RG11_EAC = 0x9273,
  COMPRESSED_RGB8_ETC2 = 0x9274,
  COMPRESSED_SRGB8_ETC2 = 0x9275,
  COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9276,
  COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9277,
  COMPRESSED_RGBA8_ETC2_EAC = 0x9278,
  COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 0x9279,
}

// https://registry.khronos.org/webgl/extensions/WEBGL_compressed_texture_astc/
const enum WEBGL_compressed_texture_astc {
  COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93b0,
  COMPRESSED_RGBA_ASTC_5x4_KHR = 0x93b1,
  COMPRESSED_RGBA_ASTC_5x5_KHR = 0x93b2,
  COMPRESSED_RGBA_ASTC_6x5_KHR = 0x93b3,
  COMPRESSED_RGBA_ASTC_6x6_KHR = 0x93b4,
  COMPRESSED_RGBA_ASTC_8x5_KHR = 0x93b5,
  COMPRESSED_RGBA_ASTC_8x6_KHR = 0x93b6,
  COMPRESSED_RGBA_ASTC_8x8_KHR = 0x93b7,
  COMPRESSED_RGBA_ASTC_10x5_KHR = 0x93b8,
  COMPRESSED_RGBA_ASTC_10x6_KHR = 0x93b9,
  COMPRESSED_RGBA_ASTC_10x8_KHR = 0x93ba,
  COMPRESSED_RGBA_ASTC_10x10_KHR = 0x93bb,
  COMPRESSED_RGBA_ASTC_12x10_KHR = 0x93bc,
  COMPRESSED_RGBA_ASTC_12x12_KHR = 0x93bd,

  COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = 0x93d0,
  COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR = 0x93d1,
  COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR = 0x93d2,
  COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR = 0x93d3,
  COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR = 0x93d4,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR = 0x93d5,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR = 0x93d6,
  COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR = 0x93d7,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR = 0x93d8,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR = 0x93d9,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR = 0x93da,
  COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR = 0x93db,
  COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR = 0x93dc,
  COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR = 0x93dd,
}

const mapToWebGL: Record<SurfaceFormat, number> = {
  // 8-bit formats
  R8_UNORM: gl.R8,
  R8_SNORM: gl.R8_SNORM,
  R8_UINT: gl.R8UI,
  R8_SINT: gl.R8I,
  // 16-bit formats
  R16_UNORM: EXT_texture_norm16.R16_EXT,
  R16_SNORM: EXT_texture_norm16.R16_SNORM_EXT,
  R16_UINT: gl.R16UI,
  R16_SINT: gl.R16I,
  R16_FLOAT: gl.R16F,
  RG8_UNORM: gl.RG8,
  RG8_SNORM: gl.RG8_SNORM,
  RG8_UINT: gl.RG8UI,
  RG8_SINT: gl.RG8I,
  // 32-bit formats
  R32_UINT: gl.R32UI,
  R32_SINT: gl.R32I,
  R32_FLOAT: gl.R32F,
  RG16_UNORM: EXT_texture_norm16.RG16_EXT,
  RG16_SNORM: EXT_texture_norm16.RG16_SNORM_EXT,
  RG16_UINT: gl.RG16UI,
  RG16_SINT: gl.RG16I,
  RG16_FLOAT: gl.RG16F,
  RGBA8_UNORM: gl.RGBA8,
  RGBA8_UNORM_SRGB: gl.SRGB8_ALPHA8,
  RGBA8_SNORM: gl.RGBA8_SNORM,
  RGBA8_UINT: gl.RGBA8UI,
  RGBA8_SINT: gl.RGBA8I,
  BGRA8_UNORM: EXT_texture_format_BGRA8888.BGRA_EXT,
  BGRA8_UNORM_SRGB: gl.SRGB8_ALPHA8,
  // Packed 32-bit formats
  RGB9_E5_UFLOAT: gl.RGB9_E5,
  RGB10_A2_UINT: gl.RGB10_A2UI,
  RGB10_A2_UNORM: gl.RGB10_A2,
  RG11_B10_UFLOAT: gl.R11F_G11F_B10F,
  // 64-bit formats
  RG32_UINT: gl.RG32UI,
  RG32_SINT: gl.RG32I,
  RG32_FLOAT: gl.RG32F,
  RGBA16_UNORM: EXT_texture_norm16.RGBA16_EXT,
  RGBA16_SNORM: EXT_texture_norm16.RGBA16_SNORM_EXT,
  RGBA16_UINT: gl.RGBA16UI,
  RGBA16_SINT: gl.RGBA16I,
  RGBA16_FLOAT: gl.RGBA16F,
  // 128-bit formats
  RGBA32_UINT: gl.RGBA32UI,
  RGBA32_SINT: gl.RGBA32I,
  RGBA32_FLOAT: gl.RGBA32F,
  // Depth/stencil formats
  STENCIL8: gl.STENCIL_INDEX8,
  DEPTH16_UNORM: gl.DEPTH_COMPONENT16,
  DEPTH24_PLUS: gl.DEPTH_COMPONENT24,
  DEPTH24_PLUS_STENCIL8: gl.DEPTH24_STENCIL8,
  DEPTH32_FLOAT: gl.DEPTH_COMPONENT32F,
  DEPTH32_FLOAT_STENCIL8: gl.DEPTH32F_STENCIL8,
  // BC
  BC1_RGBA_UNORM: WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
  BC2_RGBA_UNORM: WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
  BC3_RGBA_UNORM: WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT,
  BC1_RGBA_UNORM_SRGB: WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
  BC2_RGBA_UNORM_SRGB: WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
  BC3_RGBA_UNORM_SRGB: WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,
  BC4_R_UNORM: EXT_texture_compression_rgtc.COMPRESSED_RED_RGTC1_EXT,
  BC4_R_SNORM: EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
  BC5_RG_UNORM: EXT_texture_compression_rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
  BC5_RG_SNORM: EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,
  BC6H_RGB_UFLOAT: EXT_texture_compression_bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
  BC6H_RGB_FLOAT: EXT_texture_compression_bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
  BC7_RGBA_UNORM: EXT_texture_compression_bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
  BC7_RGBA_UNORM_SRGB: EXT_texture_compression_bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT,
  // ETC2
  EAC_R11_UNORM: WEBGL_compressed_texture_etc.COMPRESSED_R11_EAC,
  EAC_R11_SNORM: WEBGL_compressed_texture_etc.COMPRESSED_SIGNED_R11_EAC,
  EAC_RG11_UNORM: WEBGL_compressed_texture_etc.COMPRESSED_RG11_EAC,
  EAC_RG11_SNORM: WEBGL_compressed_texture_etc.COMPRESSED_SIGNED_RG11_EAC,
  ETC2_RGB8_UNORM: WEBGL_compressed_texture_etc.COMPRESSED_RGB8_ETC2,
  ETC2_RGB8_UNORM_SRGB: WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_ETC2,
  ETC2_RGB8_A1_UNORM: WEBGL_compressed_texture_etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  ETC2_RGB8_A1_UNORM_SRGB: WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  ETC2_RGBA8_UNORM: WEBGL_compressed_texture_etc.COMPRESSED_RGBA8_ETC2_EAC,
  ETC2_RGBA8_UNORM_SRGB: WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
  // ASTC
  ASTC_4x4_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_4x4_KHR,
  ASTC_4x4_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
  ASTC_5x4_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_5x4_KHR,
  ASTC_5x4_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
  ASTC_5x5_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_5x5_KHR,
  ASTC_5x5_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
  ASTC_6x5_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_6x5_KHR,
  ASTC_6x5_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
  ASTC_6x6_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_6x6_KHR,
  ASTC_6x6_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
  ASTC_8x5_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x5_KHR,
  ASTC_8x5_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
  ASTC_8x6_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x6_KHR,
  ASTC_8x6_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
  ASTC_8x8_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x8_KHR,
  ASTC_8x8_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
  ASTC_10x5_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x5_KHR,
  ASTC_10x5_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
  ASTC_10x6_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x6_KHR,
  ASTC_10x6_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
  ASTC_10x8_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x8_KHR,
  ASTC_10x8_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
  ASTC_10x10_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x10_KHR,
  ASTC_10x10_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
  ASTC_12x10_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_12x10_KHR,
  ASTC_12x10_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
  ASTC_12x12_UNORM: WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_12x12_KHR,
  ASTC_12x12_UNORM_SRGB: WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR,
}

const mapToWebGLFormat: Record<SurfaceFormat, number> = {
  // 8-bit formats
  R8_UNORM: gl.RED,
  R8_SNORM: gl.RED,
  R8_UINT: gl.RED,
  R8_SINT: gl.RED,
  // 16-bit formats
  R16_UNORM: gl.RED,
  R16_SNORM: gl.RED,
  R16_UINT: gl.RED,
  R16_SINT: gl.RED,
  R16_FLOAT: gl.RED,
  RG8_UNORM: gl.RG,
  RG8_SNORM: gl.RG,
  RG8_UINT: gl.RG,
  RG8_SINT: gl.RG,
  // 32-bit formats
  R32_UINT: gl.RED,
  R32_SINT: gl.RED,
  R32_FLOAT: gl.RED,
  RG16_UNORM: gl.RG,
  RG16_SNORM: gl.RG,
  RG16_UINT: gl.RG,
  RG16_SINT: gl.RG,
  RG16_FLOAT: gl.RG,
  RGBA8_UNORM: gl.RGBA,
  RGBA8_UNORM_SRGB: gl.RGBA,
  RGBA8_SNORM: gl.RGBA,
  RGBA8_UINT: gl.RGBA,
  RGBA8_SINT: gl.RGBA,
  BGRA8_UNORM: EXT_texture_format_BGRA8888.BGRA_EXT,
  BGRA8_UNORM_SRGB: EXT_texture_format_BGRA8888.BGRA_EXT,
  // Packed 32-bit formats
  RGB9_E5_UFLOAT: null, // not supported yet
  RGB10_A2_UINT: null, // not supported yet
  RGB10_A2_UNORM: null, // not supported yet
  RG11_B10_UFLOAT: null, // not supported yet
  // 64-bit formats
  RG32_UINT: gl.RG,
  RG32_SINT: gl.RG,
  RG32_FLOAT: gl.RG,
  RGBA16_UNORM: gl.RGBA,
  RGBA16_SNORM: gl.RGBA,
  RGBA16_UINT: gl.RGBA,
  RGBA16_SINT: gl.RGBA,
  RGBA16_FLOAT: gl.RGBA,
  // 128-bit formats
  RGBA32_UINT: gl.RGBA,
  RGBA32_SINT: gl.RGBA,
  RGBA32_FLOAT: gl.RGBA,
  // Depth/stencil formats
  STENCIL8: null,
  DEPTH16_UNORM: null,
  DEPTH24_PLUS: null,
  DEPTH24_PLUS_STENCIL8: null,
  DEPTH32_FLOAT: null,
  DEPTH32_FLOAT_STENCIL8: null,
  // BC
  BC1_RGBA_UNORM: null,
  BC2_RGBA_UNORM: null,
  BC3_RGBA_UNORM: null,
  BC1_RGBA_UNORM_SRGB: null,
  BC2_RGBA_UNORM_SRGB: null,
  BC3_RGBA_UNORM_SRGB: null,
  BC4_R_UNORM: null,
  BC4_R_SNORM: null,
  BC5_RG_UNORM: null,
  BC5_RG_SNORM: null,
  BC6H_RGB_UFLOAT: null,
  BC6H_RGB_FLOAT: null,
  BC7_RGBA_UNORM: null,
  BC7_RGBA_UNORM_SRGB: null,
  // ETC2
  EAC_R11_UNORM: null,
  EAC_R11_SNORM: null,
  EAC_RG11_UNORM: null,
  EAC_RG11_SNORM: null,
  ETC2_RGB8_UNORM: null,
  ETC2_RGB8_UNORM_SRGB: null,
  ETC2_RGB8_A1_UNORM: null,
  ETC2_RGB8_A1_UNORM_SRGB: null,
  ETC2_RGBA8_UNORM: null,
  ETC2_RGBA8_UNORM_SRGB: null,
  // ASTC
  ASTC_4x4_UNORM: null,
  ASTC_4x4_UNORM_SRGB: null,
  ASTC_5x4_UNORM: null,
  ASTC_5x4_UNORM_SRGB: null,
  ASTC_5x5_UNORM: null,
  ASTC_5x5_UNORM_SRGB: null,
  ASTC_6x5_UNORM: null,
  ASTC_6x5_UNORM_SRGB: null,
  ASTC_6x6_UNORM: null,
  ASTC_6x6_UNORM_SRGB: null,
  ASTC_8x5_UNORM: null,
  ASTC_8x5_UNORM_SRGB: null,
  ASTC_8x6_UNORM: null,
  ASTC_8x6_UNORM_SRGB: null,
  ASTC_8x8_UNORM: null,
  ASTC_8x8_UNORM_SRGB: null,
  ASTC_10x5_UNORM: null,
  ASTC_10x5_UNORM_SRGB: null,
  ASTC_10x6_UNORM: null,
  ASTC_10x6_UNORM_SRGB: null,
  ASTC_10x8_UNORM: null,
  ASTC_10x8_UNORM_SRGB: null,
  ASTC_10x10_UNORM: null,
  ASTC_10x10_UNORM_SRGB: null,
  ASTC_12x10_UNORM: null,
  ASTC_12x10_UNORM_SRGB: null,
  ASTC_12x12_UNORM: null,
  ASTC_12x12_UNORM_SRGB: null,
}

const mapToWebGPU: Record<SurfaceFormat, GPUTextureFormat> = {
  // 8-bit formats
  R8_UNORM: 'r8unorm',
  R8_SNORM: 'r8snorm',
  R8_UINT: 'r8uint',
  R8_SINT: 'r8sint',
  // 16-bit formats
  R16_UNORM: 'r16unorm' as any, // not standardized in WebGPU yet
  R16_SNORM: 'r16snorm' as any, // not standardized in WebGPU yet
  R16_UINT: 'r16uint',
  R16_SINT: 'r16sint',
  R16_FLOAT: 'r16float',
  RG8_UNORM: 'rg8unorm',
  RG8_SNORM: 'rg8snorm',
  RG8_UINT: 'rg8uint',
  RG8_SINT: 'rg8sint',
  // 32-bit formats
  R32_UINT: 'r32uint',
  R32_SINT: 'r32sint',
  R32_FLOAT: 'r32float',
  RG16_UNORM: 'rg16unorm' as any, // not standardized in WebGPU yet
  RG16_SNORM: 'rg16snorm' as any, // not standardized in WebGPU yet
  RG16_UINT: 'rg16uint',
  RG16_SINT: 'rg16sint',
  RG16_FLOAT: 'rg16float',
  RGBA8_UNORM: 'rgba8unorm',
  RGBA8_UNORM_SRGB: 'rgba8unorm-srgb',
  RGBA8_SNORM: 'rgba8snorm',
  RGBA8_UINT: 'rgba8uint',
  RGBA8_SINT: 'rgba8sint',
  BGRA8_UNORM: 'bgra8unorm',
  BGRA8_UNORM_SRGB: 'bgra8unorm-srgb',
  // Packed 32-bit formats
  RGB9_E5_UFLOAT: 'rgb9e5ufloat' as any, // not standardized in WebGPU yet
  RGB10_A2_UINT: 'rgb10a2uint' as any, // not standardized in WebGPU yet
  RGB10_A2_UNORM: 'rgb10a2unorm',
  RG11_B10_UFLOAT: 'rg11b10ufloat' as any,
  // 64-bit formats
  RG32_UINT: 'rg32uint',
  RG32_SINT: 'rg32sint',
  RG32_FLOAT: 'rg32float',
  RGBA16_UNORM: 'rgba16unorm' as any, // not standardized in WebGPU yet
  RGBA16_SNORM: 'rgba16snorm' as any, // not standardized in WebGPU yet
  RGBA16_UINT: 'rgba16uint',
  RGBA16_SINT: 'rgba16sint',
  RGBA16_FLOAT: 'rgba16float',
  // 128-bit formats
  RGBA32_UINT: 'rgba32uint',
  RGBA32_SINT: 'rgba32sint',
  RGBA32_FLOAT: 'rgba32float',
  // Depth/stencil formats
  STENCIL8: 'stencil8' as any,
  DEPTH16_UNORM: 'depth16unorm' as any,
  DEPTH24_PLUS: 'depth24plus',
  DEPTH24_PLUS_STENCIL8: 'depth24plus-stencil8',
  DEPTH32_FLOAT: 'depth32float',
  DEPTH32_FLOAT_STENCIL8: 'depth32float-stencil8' as any,
  // BC
  BC1_RGBA_UNORM: 'bc1-rgba-unorm',
  BC2_RGBA_UNORM: 'bc2-rgba-unorm',
  BC3_RGBA_UNORM: 'bc3-rgba-unorm',
  BC1_RGBA_UNORM_SRGB: 'bc1-rgba-unorm-srgb',
  BC2_RGBA_UNORM_SRGB: 'bc2-rgba-unorm-srgb',
  BC3_RGBA_UNORM_SRGB: 'bc3-rgba-unorm-srgb',
  BC4_R_UNORM: 'bc4-r-unorm',
  BC4_R_SNORM: 'bc4-r-snorm',
  BC5_RG_UNORM: 'bc5-rg-unorm',
  BC5_RG_SNORM: 'bc5-rg-snorm',
  BC6H_RGB_UFLOAT: 'bc6h-rgb-ufloat',
  BC6H_RGB_FLOAT: 'bc6h-rgb-float' as any,
  BC7_RGBA_UNORM: 'bc7-rgba-unorm',
  BC7_RGBA_UNORM_SRGB: 'bc7-rgba-unorm-srgb',
  // ETC2
  EAC_R11_UNORM: 'eac-r11-unorm' as any,
  EAC_R11_SNORM: 'eac-r11-snorm' as any,
  EAC_RG11_UNORM: 'eac-rg11-unorm' as any,
  EAC_RG11_SNORM: 'eac-rg11-snorm' as any,
  ETC2_RGB8_UNORM: 'etc2-rgb8unorm' as any,
  ETC2_RGB8_UNORM_SRGB: 'etc2-rgb8unorm-srgb' as any,
  ETC2_RGB8_A1_UNORM: 'etc2-rgb8a1unorm' as any,
  ETC2_RGB8_A1_UNORM_SRGB: 'etc2-rgb8a1unorm-srgb' as any,
  ETC2_RGBA8_UNORM: 'etc2-rgba8unorm' as any,
  ETC2_RGBA8_UNORM_SRGB: 'etc2-rgba8unorm-srgb' as any,
  // ASTC
  ASTC_4x4_UNORM: 'astc-4x4-unorm' as any,
  ASTC_4x4_UNORM_SRGB: 'astc-4x4-unorm-srgb' as any,
  ASTC_5x4_UNORM: 'astc-5x4-unorm' as any,
  ASTC_5x4_UNORM_SRGB: 'astc-5x4-unorm-srgb' as any,
  ASTC_5x5_UNORM: 'astc-5x5-unorm' as any,
  ASTC_5x5_UNORM_SRGB: 'astc-5x5-unorm-srgb' as any,
  ASTC_6x5_UNORM: 'astc-6x5-unorm' as any,
  ASTC_6x5_UNORM_SRGB: 'astc-6x5-unorm-srgb' as any,
  ASTC_6x6_UNORM: 'astc-6x6-unorm' as any,
  ASTC_6x6_UNORM_SRGB: 'astc-6x6-unorm-srgb' as any,
  ASTC_8x5_UNORM: 'astc-8x5-unorm' as any,
  ASTC_8x5_UNORM_SRGB: 'astc-8x5-unorm-srgb' as any,
  ASTC_8x6_UNORM: 'astc-8x6-unorm' as any,
  ASTC_8x6_UNORM_SRGB: 'astc-8x6-unorm-srgb' as any,
  ASTC_8x8_UNORM: 'astc-8x8-unorm' as any,
  ASTC_8x8_UNORM_SRGB: 'astc-8x8-unorm-srgb' as any,
  ASTC_10x5_UNORM: 'astc-10x5-unorm' as any,
  ASTC_10x5_UNORM_SRGB: 'astc-10x5-unorm-srgb' as any,
  ASTC_10x6_UNORM: 'astc-10x6-unorm' as any,
  ASTC_10x6_UNORM_SRGB: 'astc-10x6-unorm-srgb' as any,
  ASTC_10x8_UNORM: 'astc-10x8-unorm' as any,
  ASTC_10x8_UNORM_SRGB: 'astc-10x8-unorm-srgb' as any,
  ASTC_10x10_UNORM: 'astc-10x10-unorm' as any,
  ASTC_10x10_UNORM_SRGB: 'astc-10x10-unorm-srgb' as any,
  ASTC_12x10_UNORM: 'astc-12x10-unorm' as any,
  ASTC_12x10_UNORM_SRGB: 'astc-12x10-unorm-srgb' as any,
  ASTC_12x12_UNORM: 'astc-12x12-unorm' as any,
  ASTC_12x12_UNORM_SRGB: 'astc-12x12-unorm-srgb' as any,
}

const mapToSRGB: Record<SurfaceFormat, boolean> = {
  // 8-bit formats
  R8_UNORM: false,
  R8_SNORM: false,
  R8_UINT: false,
  R8_SINT: false,
  // 16-bit formats
  R16_UNORM: false,
  R16_SNORM: false,
  R16_UINT: false,
  R16_SINT: false,
  R16_FLOAT: false,
  RG8_UNORM: false,
  RG8_SNORM: false,
  RG8_UINT: false,
  RG8_SINT: false,
  // 32-bit formats
  R32_UINT: false,
  R32_SINT: false,
  R32_FLOAT: false,
  RG16_UNORM: false,
  RG16_SNORM: false,
  RG16_UINT: false,
  RG16_SINT: false,
  RG16_FLOAT: false,
  RGBA8_UNORM: false,
  RGBA8_UNORM_SRGB: true,
  RGBA8_SNORM: false,
  RGBA8_UINT: false,
  RGBA8_SINT: false,
  BGRA8_UNORM: false,
  BGRA8_UNORM_SRGB: true,
  // Packed 32-bit formats
  RGB9_E5_UFLOAT: false,
  RGB10_A2_UINT: false,
  RGB10_A2_UNORM: false,
  RG11_B10_UFLOAT: false,
  // 64-bit formats
  RG32_UINT: false,
  RG32_SINT: false,
  RG32_FLOAT: false,
  RGBA16_UNORM: false,
  RGBA16_SNORM: false,
  RGBA16_UINT: false,
  RGBA16_SINT: false,
  RGBA16_FLOAT: false,
  // 128-bit formats
  RGBA32_UINT: false,
  RGBA32_SINT: false,
  RGBA32_FLOAT: false,
  // Depth/stencil formats
  STENCIL8: false,
  DEPTH16_UNORM: false,
  DEPTH24_PLUS: false,
  DEPTH24_PLUS_STENCIL8: false,
  DEPTH32_FLOAT: false,
  DEPTH32_FLOAT_STENCIL8: false,
  // BC
  BC1_RGBA_UNORM: false,
  BC2_RGBA_UNORM: false,
  BC3_RGBA_UNORM: false,
  BC1_RGBA_UNORM_SRGB: true,
  BC2_RGBA_UNORM_SRGB: true,
  BC3_RGBA_UNORM_SRGB: true,
  BC4_R_UNORM: false,
  BC4_R_SNORM: false,
  BC5_RG_UNORM: false,
  BC5_RG_SNORM: false,
  BC6H_RGB_UFLOAT: false,
  BC6H_RGB_FLOAT: false,
  BC7_RGBA_UNORM: false,
  BC7_RGBA_UNORM_SRGB: true,
  // ETC2
  EAC_R11_UNORM: false,
  EAC_R11_SNORM: false,
  EAC_RG11_UNORM: false,
  EAC_RG11_SNORM: false,
  ETC2_RGB8_UNORM: false,
  ETC2_RGB8_UNORM_SRGB: true,
  ETC2_RGB8_A1_UNORM: false,
  ETC2_RGB8_A1_UNORM_SRGB: true,
  ETC2_RGBA8_UNORM: false,
  ETC2_RGBA8_UNORM_SRGB: true,
  // ASTC
  ASTC_4x4_UNORM: false,
  ASTC_4x4_UNORM_SRGB: true,
  ASTC_5x4_UNORM: false,
  ASTC_5x4_UNORM_SRGB: true,
  ASTC_5x5_UNORM: false,
  ASTC_5x5_UNORM_SRGB: true,
  ASTC_6x5_UNORM: false,
  ASTC_6x5_UNORM_SRGB: true,
  ASTC_6x6_UNORM: false,
  ASTC_6x6_UNORM_SRGB: true,
  ASTC_8x5_UNORM: false,
  ASTC_8x5_UNORM_SRGB: true,
  ASTC_8x6_UNORM: false,
  ASTC_8x6_UNORM_SRGB: true,
  ASTC_8x8_UNORM: false,
  ASTC_8x8_UNORM_SRGB: true,
  ASTC_10x5_UNORM: false,
  ASTC_10x5_UNORM_SRGB: true,
  ASTC_10x6_UNORM: false,
  ASTC_10x6_UNORM_SRGB: true,
  ASTC_10x8_UNORM: false,
  ASTC_10x8_UNORM_SRGB: true,
  ASTC_10x10_UNORM: false,
  ASTC_10x10_UNORM_SRGB: true,
  ASTC_12x10_UNORM: false,
  ASTC_12x10_UNORM_SRGB: true,
  ASTC_12x12_UNORM: false,
  ASTC_12x12_UNORM_SRGB: true,
}

const mapToDataType: Record<SurfaceFormat, DataType> = {
  // 8-bit formats
  R8_UNORM: 'uint8',
  R8_SNORM: 'uint8',
  R8_UINT: 'uint8',
  R8_SINT: 'uint8',
  // 16-bit formats
  R16_UNORM: 'uint16',
  R16_SNORM: 'uint16',
  R16_UINT: 'uint16',
  R16_SINT: 'uint16',
  R16_FLOAT: 'float16',
  RG8_UNORM: 'uint8',
  RG8_SNORM: 'uint8',
  RG8_UINT: 'uint8',
  RG8_SINT: 'uint8',
  // 32-bit formats
  R32_UINT: 'uint32',
  R32_SINT: 'uint32',
  R32_FLOAT: 'float32',
  RG16_UNORM: 'uint16',
  RG16_SNORM: 'uint16',
  RG16_UINT: 'uint16',
  RG16_SINT: 'uint16',
  RG16_FLOAT: 'float16',
  RGBA8_UNORM: 'uint8',
  RGBA8_UNORM_SRGB: 'uint8',
  RGBA8_SNORM: 'uint8',
  RGBA8_UINT: 'uint8',
  RGBA8_SINT: 'uint8',
  BGRA8_UNORM: 'uint8',
  BGRA8_UNORM_SRGB: 'uint8',
  // Packed 32-bit formats
  RGB9_E5_UFLOAT: null, // not supported
  RGB10_A2_UINT: null, // not supported
  RGB10_A2_UNORM: null, // not supported
  RG11_B10_UFLOAT: null, // not supported
  // 64-bit formats
  RG32_UINT: 'uint32',
  RG32_SINT: 'uint32',
  RG32_FLOAT: 'float32',
  RGBA16_UNORM: 'uint16',
  RGBA16_SNORM: 'uint16',
  RGBA16_UINT: 'uint16',
  RGBA16_SINT: 'uint16',
  RGBA16_FLOAT: 'float16',
  // 128-bit formats
  RGBA32_UINT: 'uint32',
  RGBA32_SINT: 'uint32',
  RGBA32_FLOAT: 'float32',
  // Depth/stencil formats
  STENCIL8: null, // not needed
  DEPTH16_UNORM: null, // not needed
  DEPTH24_PLUS: null, // not needed
  DEPTH24_PLUS_STENCIL8: null, // not needed
  DEPTH32_FLOAT: null, // not needed
  DEPTH32_FLOAT_STENCIL8: null, // not needed
  // BC
  BC1_RGBA_UNORM: null,
  BC2_RGBA_UNORM: null,
  BC3_RGBA_UNORM: null,
  BC1_RGBA_UNORM_SRGB: null,
  BC2_RGBA_UNORM_SRGB: null,
  BC3_RGBA_UNORM_SRGB: null,
  BC4_R_UNORM: null,
  BC4_R_SNORM: null,
  BC5_RG_UNORM: null,
  BC5_RG_SNORM: null,
  BC6H_RGB_UFLOAT: null,
  BC6H_RGB_FLOAT: null,
  BC7_RGBA_UNORM: null,
  BC7_RGBA_UNORM_SRGB: null,
  // ETC2
  EAC_R11_UNORM: null,
  EAC_R11_SNORM: null,
  EAC_RG11_UNORM: null,
  EAC_RG11_SNORM: null,
  ETC2_RGB8_UNORM: null,
  ETC2_RGB8_UNORM_SRGB: null,
  ETC2_RGB8_A1_UNORM: null,
  ETC2_RGB8_A1_UNORM_SRGB: null,
  ETC2_RGBA8_UNORM: null,
  ETC2_RGBA8_UNORM_SRGB: null,
  // ASTC
  ASTC_4x4_UNORM: null,
  ASTC_4x4_UNORM_SRGB: null,
  ASTC_5x4_UNORM: null,
  ASTC_5x4_UNORM_SRGB: null,
  ASTC_5x5_UNORM: null,
  ASTC_5x5_UNORM_SRGB: null,
  ASTC_6x5_UNORM: null,
  ASTC_6x5_UNORM_SRGB: null,
  ASTC_6x6_UNORM: null,
  ASTC_6x6_UNORM_SRGB: null,
  ASTC_8x5_UNORM: null,
  ASTC_8x5_UNORM_SRGB: null,
  ASTC_8x6_UNORM: null,
  ASTC_8x6_UNORM_SRGB: null,
  ASTC_8x8_UNORM: null,
  ASTC_8x8_UNORM_SRGB: null,
  ASTC_10x5_UNORM: null,
  ASTC_10x5_UNORM_SRGB: null,
  ASTC_10x6_UNORM: null,
  ASTC_10x6_UNORM_SRGB: null,
  ASTC_10x8_UNORM: null,
  ASTC_10x8_UNORM_SRGB: null,
  ASTC_10x10_UNORM: null,
  ASTC_10x10_UNORM_SRGB: null,
  ASTC_12x10_UNORM: null,
  ASTC_12x10_UNORM_SRGB: null,
  ASTC_12x12_UNORM: null,
  ASTC_12x12_UNORM_SRGB: null,
}

const mapToCompressed: Record<SurfaceFormat, boolean> = {
  // 8-bit formats
  R8_UNORM: false,
  R8_SNORM: false,
  R8_UINT: false,
  R8_SINT: false,
  // 16-bit formats
  R16_UNORM: false,
  R16_SNORM: false,
  R16_UINT: false,
  R16_SINT: false,
  R16_FLOAT: false,
  RG8_UNORM: false,
  RG8_SNORM: false,
  RG8_UINT: false,
  RG8_SINT: false,
  // 32-bit formats
  R32_UINT: false,
  R32_SINT: false,
  R32_FLOAT: false,
  RG16_UNORM: false,
  RG16_SNORM: false,
  RG16_UINT: false,
  RG16_SINT: false,
  RG16_FLOAT: false,
  RGBA8_UNORM: false,
  RGBA8_UNORM_SRGB: false,
  RGBA8_SNORM: false,
  RGBA8_UINT: false,
  RGBA8_SINT: false,
  BGRA8_UNORM: false,
  BGRA8_UNORM_SRGB: false,
  // Packed 32-bit formats
  RGB9_E5_UFLOAT: false,
  RGB10_A2_UINT: false,
  RGB10_A2_UNORM: false,
  RG11_B10_UFLOAT: false,
  // 64-bit formats
  RG32_UINT: false,
  RG32_SINT: false,
  RG32_FLOAT: false,
  RGBA16_UNORM: false,
  RGBA16_SNORM: false,
  RGBA16_UINT: false,
  RGBA16_SINT: false,
  RGBA16_FLOAT: false,
  // 128-bit formats
  RGBA32_UINT: false,
  RGBA32_SINT: false,
  RGBA32_FLOAT: false,
  // Depth/stencil formats
  STENCIL8: false,
  DEPTH16_UNORM: false,
  DEPTH24_PLUS: false,
  DEPTH24_PLUS_STENCIL8: false,
  DEPTH32_FLOAT: false,
  DEPTH32_FLOAT_STENCIL8: false,
  // BC
  BC1_RGBA_UNORM: true,
  BC2_RGBA_UNORM: true,
  BC3_RGBA_UNORM: true,
  BC1_RGBA_UNORM_SRGB: true,
  BC2_RGBA_UNORM_SRGB: true,
  BC3_RGBA_UNORM_SRGB: true,
  BC4_R_UNORM: true,
  BC4_R_SNORM: true,
  BC5_RG_UNORM: true,
  BC5_RG_SNORM: true,
  BC6H_RGB_UFLOAT: true,
  BC6H_RGB_FLOAT: true,
  BC7_RGBA_UNORM: true,
  BC7_RGBA_UNORM_SRGB: true,
  // ETC2
  EAC_R11_UNORM: true,
  EAC_R11_SNORM: true,
  EAC_RG11_UNORM: true,
  EAC_RG11_SNORM: true,
  ETC2_RGB8_UNORM: true,
  ETC2_RGB8_UNORM_SRGB: true,
  ETC2_RGB8_A1_UNORM: true,
  ETC2_RGB8_A1_UNORM_SRGB: true,
  ETC2_RGBA8_UNORM: true,
  ETC2_RGBA8_UNORM_SRGB: true,
  // ASTC
  ASTC_4x4_UNORM: true,
  ASTC_4x4_UNORM_SRGB: true,
  ASTC_5x4_UNORM: true,
  ASTC_5x4_UNORM_SRGB: true,
  ASTC_5x5_UNORM: true,
  ASTC_5x5_UNORM_SRGB: true,
  ASTC_6x5_UNORM: true,
  ASTC_6x5_UNORM_SRGB: true,
  ASTC_6x6_UNORM: true,
  ASTC_6x6_UNORM_SRGB: true,
  ASTC_8x5_UNORM: true,
  ASTC_8x5_UNORM_SRGB: true,
  ASTC_8x6_UNORM: true,
  ASTC_8x6_UNORM_SRGB: true,
  ASTC_8x8_UNORM: true,
  ASTC_8x8_UNORM_SRGB: true,
  ASTC_10x5_UNORM: true,
  ASTC_10x5_UNORM_SRGB: true,
  ASTC_10x6_UNORM: true,
  ASTC_10x6_UNORM_SRGB: true,
  ASTC_10x8_UNORM: true,
  ASTC_10x8_UNORM_SRGB: true,
  ASTC_10x10_UNORM: true,
  ASTC_10x10_UNORM_SRGB: true,
  ASTC_12x10_UNORM: true,
  ASTC_12x10_UNORM_SRGB: true,
  ASTC_12x12_UNORM: true,
  ASTC_12x12_UNORM_SRGB: true,
}

const mapToWebGLExtension: Record<number, string | null> = {
  [WEBGL_compressed_texture_s3tc.COMPRESSED_RGB_S3TC_DXT1_EXT]: 'WEBGL_compressed_texture_s3tc',
  [WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT]: 'WEBGL_compressed_texture_s3tc',
  [WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT]: 'WEBGL_compressed_texture_s3tc',
  [WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT]: 'WEBGL_compressed_texture_s3tc',

  [WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_S3TC_DXT1_EXT]: 'WEBGL_compressed_texture_s3tc_srgb',
  [WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT]: 'WEBGL_compressed_texture_s3tc_srgb',
  [WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT]: 'WEBGL_compressed_texture_s3tc_srgb',
  [WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT]: 'WEBGL_compressed_texture_s3tc_srgb',

  [WEBGL_compressed_texture_pvrtc.COMPRESSED_RGB_PVRTC_4BPPV1_IMG]: 'WEBGL_compressed_texture_pvrtc',
  [WEBGL_compressed_texture_pvrtc.COMPRESSED_RGB_PVRTC_2BPPV1_IMG]: 'WEBGL_compressed_texture_pvrtc',
  [WEBGL_compressed_texture_pvrtc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG]: 'WEBGL_compressed_texture_pvrtc',
  [WEBGL_compressed_texture_pvrtc.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG]: 'WEBGL_compressed_texture_pvrtc',

  [EXT_texture_compression_bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT]: 'EXT_texture_compression_bptc',
  [EXT_texture_compression_bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT]: 'EXT_texture_compression_bptc',
  [EXT_texture_compression_bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT]: 'EXT_texture_compression_bptc',
  [EXT_texture_compression_bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT]: 'EXT_texture_compression_bptc',

  [EXT_texture_compression_rgtc.COMPRESSED_RED_RGTC1_EXT]: 'EXT_texture_compression_rgtc',
  [EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT]: 'EXT_texture_compression_rgtc',
  [EXT_texture_compression_rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT]: 'EXT_texture_compression_rgtc',
  [EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT]: 'EXT_texture_compression_rgtc',

  [WEBGL_compressed_texture_etc1.COMPRESSED_RGB_ETC1_WEBGL]: 'WEBGL_compressed_texture_etc1',

  [EXT_texture_format_BGRA8888.BGRA_EXT]: 'EXT_texture_format_BGRA8888',
  [EXT_texture_format_BGRA8888.BGRA8_EXT]: 'EXT_texture_format_BGRA8888',

  [EXT_texture_norm16.R16_EXT]: 'EXT_texture_norm16',
  [EXT_texture_norm16.RG16_EXT]: 'EXT_texture_norm16',
  [EXT_texture_norm16.RGB16_EXT]: 'EXT_texture_norm16',
  [EXT_texture_norm16.RGBA16_EXT]: 'EXT_texture_norm16',
  [EXT_texture_norm16.R16_SNORM_EXT]: 'EXT_texture_norm16',
  [EXT_texture_norm16.RG16_SNORM_EXT]: 'EXT_texture_norm16',
  [EXT_texture_norm16.RGB16_SNORM_EXT]: 'EXT_texture_norm16',
  [EXT_texture_norm16.RGBA16_SNORM_EXT]: 'EXT_texture_norm16',

  [WEBGL_compressed_texture_etc.COMPRESSED_R11_EAC]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_SIGNED_R11_EAC]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_RG11_EAC]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_SIGNED_RG11_EAC]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_RGB8_ETC2]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_ETC2]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_RGBA8_ETC2_EAC]: 'WEBGL_compressed_texture_etc',
  [WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC]: 'WEBGL_compressed_texture_etc',

  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_4x4_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_5x4_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_5x5_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_6x5_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_6x6_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x5_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x6_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x8_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x5_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x6_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x8_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x10_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_12x10_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_12x12_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR]: 'WEBGL_compressed_texture_astc',
  [WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR]: 'WEBGL_compressed_texture_astc',
}

// https://learn.microsoft.com/en-us/windows/win32/api/dxgiformat/ne-dxgiformat-dxgi_format

const DXGI_FORMAT_R32G32B32A32_TYPELESS = 1
const DXGI_FORMAT_R32G32B32A32_FLOAT = 2
const DXGI_FORMAT_R32G32B32A32_UINT = 3
const DXGI_FORMAT_R32G32B32A32_SINT = 4
const DXGI_FORMAT_R32G32B32_TYPELESS = 5
const DXGI_FORMAT_R32G32B32_FLOAT = 6
const DXGI_FORMAT_R32G32B32_UINT = 7
const DXGI_FORMAT_R32G32B32_SINT = 8
const DXGI_FORMAT_R16G16B16A16_TYPELESS = 9
const DXGI_FORMAT_R16G16B16A16_FLOAT = 10
const DXGI_FORMAT_R16G16B16A16_UNORM = 11
const DXGI_FORMAT_R16G16B16A16_UINT = 12
const DXGI_FORMAT_R16G16B16A16_SNORM = 13
const DXGI_FORMAT_R16G16B16A16_SINT = 14
const DXGI_FORMAT_R32G32_TYPELESS = 15
const DXGI_FORMAT_R32G32_FLOAT = 16
const DXGI_FORMAT_R32G32_UINT = 17
const DXGI_FORMAT_R32G32_SINT = 18
const DXGI_FORMAT_R32G8X24_TYPELESS = 19
const DXGI_FORMAT_D32_FLOAT_S8X24_UINT = 20
const DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS = 21
const DXGI_FORMAT_X32_TYPELESS_G8X24_UINT = 22
const DXGI_FORMAT_R10G10B10A2_TYPELESS = 23
const DXGI_FORMAT_R10G10B10A2_UNORM = 24
const DXGI_FORMAT_R10G10B10A2_UINT = 25
const DXGI_FORMAT_R11G11B10_FLOAT = 26
const DXGI_FORMAT_R8G8B8A8_TYPELESS = 27
const DXGI_FORMAT_R8G8B8A8_UNORM = 28
const DXGI_FORMAT_R8G8B8A8_UNORM_SRGB = 29
const DXGI_FORMAT_R8G8B8A8_UINT = 30
const DXGI_FORMAT_R8G8B8A8_SNORM = 31
const DXGI_FORMAT_R8G8B8A8_SINT = 32
const DXGI_FORMAT_R16G16_TYPELESS = 33
const DXGI_FORMAT_R16G16_FLOAT = 34
const DXGI_FORMAT_R16G16_UNORM = 35
const DXGI_FORMAT_R16G16_UINT = 36
const DXGI_FORMAT_R16G16_SNORM = 37
const DXGI_FORMAT_R16G16_SINT = 38
const DXGI_FORMAT_R32_TYPELESS = 39
const DXGI_FORMAT_D32_FLOAT = 40
const DXGI_FORMAT_R32_FLOAT = 41
const DXGI_FORMAT_R32_UINT = 42
const DXGI_FORMAT_R32_SINT = 43
const DXGI_FORMAT_R24G8_TYPELESS = 44
const DXGI_FORMAT_D24_UNORM_S8_UINT = 45
const DXGI_FORMAT_R24_UNORM_X8_TYPELESS = 46
const DXGI_FORMAT_X24_TYPELESS_G8_UINT = 47
const DXGI_FORMAT_R8G8_TYPELESS = 48
const DXGI_FORMAT_R8G8_UNORM = 49
const DXGI_FORMAT_R8G8_UINT = 50
const DXGI_FORMAT_R8G8_SNORM = 51
const DXGI_FORMAT_R8G8_SINT = 52
const DXGI_FORMAT_R16_TYPELESS = 53
const DXGI_FORMAT_R16_FLOAT = 54
const DXGI_FORMAT_D16_UNORM = 55
const DXGI_FORMAT_R16_UNORM = 56
const DXGI_FORMAT_R16_UINT = 57
const DXGI_FORMAT_R16_SNORM = 58
const DXGI_FORMAT_R16_SINT = 59
const DXGI_FORMAT_R8_TYPELESS = 60
const DXGI_FORMAT_R8_UNORM = 61
const DXGI_FORMAT_R8_UINT = 62
const DXGI_FORMAT_R8_SNORM = 63
const DXGI_FORMAT_R8_SINT = 64
const DXGI_FORMAT_A8_UNORM = 65
const DXGI_FORMAT_R1_UNORM = 66
const DXGI_FORMAT_R9G9B9E5_SHAREDEXP = 67
const DXGI_FORMAT_R8G8_B8G8_UNORM = 68
const DXGI_FORMAT_G8R8_G8B8_UNORM = 69
const DXGI_FORMAT_BC1_TYPELESS = 70
const DXGI_FORMAT_BC1_UNORM = 71
const DXGI_FORMAT_BC1_UNORM_SRGB = 72
const DXGI_FORMAT_BC2_TYPELESS = 73
const DXGI_FORMAT_BC2_UNORM = 74
const DXGI_FORMAT_BC2_UNORM_SRGB = 75
const DXGI_FORMAT_BC3_TYPELESS = 76
const DXGI_FORMAT_BC3_UNORM = 77
const DXGI_FORMAT_BC3_UNORM_SRGB = 78
const DXGI_FORMAT_BC4_TYPELESS = 79
const DXGI_FORMAT_BC4_UNORM = 80
const DXGI_FORMAT_BC4_SNORM = 81
const DXGI_FORMAT_BC5_TYPELESS = 82
const DXGI_FORMAT_BC5_UNORM = 83
const DXGI_FORMAT_BC5_SNORM = 84
const DXGI_FORMAT_B5G6R5_UNORM = 85
const DXGI_FORMAT_B5G5R5A1_UNORM = 86
const DXGI_FORMAT_B8G8R8A8_UNORM = 87
const DXGI_FORMAT_B8G8R8X8_UNORM = 88
const DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM = 89
const DXGI_FORMAT_B8G8R8A8_TYPELESS = 90
const DXGI_FORMAT_B8G8R8A8_UNORM_SRGB = 91
const DXGI_FORMAT_B8G8R8X8_TYPELESS = 92
const DXGI_FORMAT_B8G8R8X8_UNORM_SRGB = 93
const DXGI_FORMAT_BC6H_TYPELESS = 94
const DXGI_FORMAT_BC6H_UF16 = 95
const DXGI_FORMAT_BC6H_SF16 = 96
const DXGI_FORMAT_BC7_TYPELESS = 97
const DXGI_FORMAT_BC7_UNORM = 98
const DXGI_FORMAT_BC7_UNORM_SRGB = 99
const DXGI_FORMAT_AYUV = 100
const DXGI_FORMAT_Y410 = 101
const DXGI_FORMAT_Y416 = 102
const DXGI_FORMAT_NV12 = 103
const DXGI_FORMAT_P010 = 104
const DXGI_FORMAT_P016 = 105
const DXGI_FORMAT_420_OPAQUE = 106
const DXGI_FORMAT_YUY2 = 107
const DXGI_FORMAT_Y210 = 108
const DXGI_FORMAT_Y216 = 109
const DXGI_FORMAT_NV11 = 110
const DXGI_FORMAT_AI44 = 111
const DXGI_FORMAT_IA44 = 112
const DXGI_FORMAT_P8 = 113
const DXGI_FORMAT_A8P8 = 114
const DXGI_FORMAT_B4G4R4A4_UNORM = 115
const DXGI_FORMAT_P208 = 130
const DXGI_FORMAT_V208 = 131
const DXGI_FORMAT_V408 = 132
const DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE = 189
const DXGI_FORMAT_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE = 190
const DXGI_FORMAT_FORCE_UINT = 0xffffffff

const mapFromDXGI = {
  // 8-bit formats
  [DXGI_FORMAT_R8_UNORM]: 'R8_UNORM',
  [DXGI_FORMAT_R8_SNORM]: 'R8_SNORM',
  [DXGI_FORMAT_R8_UINT]: 'R8_UINT',
  [DXGI_FORMAT_R8_SINT]: 'R8_SINT',
  // 16-bit formats
  [DXGI_FORMAT_R16_UNORM]: 'R16_UNORM',
  [DXGI_FORMAT_R16_SNORM]: 'R16_SNORM',
  [DXGI_FORMAT_R16_UINT]: 'R16_UINT',
  [DXGI_FORMAT_R16_SINT]: 'R16_SINT',
  [DXGI_FORMAT_R16_FLOAT]: 'R16_FLOAT',
  [DXGI_FORMAT_R8G8_UNORM]: 'RG8_UNORM',
  [DXGI_FORMAT_R8G8_SNORM]: 'RG8_SNORM',
  [DXGI_FORMAT_R8G8_UINT]: 'RG8_UINT',
  [DXGI_FORMAT_R8G8_SINT]: 'RG8_SINT',
  // 32-bit formats
  [DXGI_FORMAT_R32_UINT]: 'R32_UINT',
  [DXGI_FORMAT_R32_SINT]: 'R32_SINT',
  [DXGI_FORMAT_R32_FLOAT]: 'R32_FLOAT',
  [DXGI_FORMAT_R16G16_UNORM]: 'RG16_UNORM',
  [DXGI_FORMAT_R16G16_SNORM]: 'RG16_SNORM',
  [DXGI_FORMAT_R16G16_UINT]: 'RG16_UINT',
  [DXGI_FORMAT_R16G16_SINT]: 'RG16_SINT',
  [DXGI_FORMAT_R16G16_FLOAT]: 'RG16_FLOAT',
  [DXGI_FORMAT_R8G8B8A8_UNORM]: 'RGBA8_UNORM',
  [DXGI_FORMAT_R8G8B8A8_UNORM_SRGB]: 'RGBA8_UNORM_SRGB',
  [DXGI_FORMAT_R8G8B8A8_SNORM]: 'RGBA8_SNORM',
  [DXGI_FORMAT_R8G8B8A8_UINT]: 'RGBA8_UINT',
  [DXGI_FORMAT_R8G8B8A8_SINT]: 'RGBA8_SINT',
  [DXGI_FORMAT_B8G8R8A8_UNORM]: 'BGRA8_UNORM',
  [DXGI_FORMAT_B8G8R8A8_UNORM_SRGB]: 'BGRA8_UNORM_SRGB',
  // Packed 32-bit formats
  [DXGI_FORMAT_R9G9B9E5_SHAREDEXP]: 'RGB9_E5_UFLOAT',
  [DXGI_FORMAT_R10G10B10A2_UINT]: 'RGB10_A2_UNORM',
  [DXGI_FORMAT_R10G10B10A2_UNORM]: 'RGB10_A2_UNORM',
  [DXGI_FORMAT_R11G11B10_FLOAT]: 'RG11_B10_UFLOAT',
  // 64-bit formats
  [DXGI_FORMAT_R32G32_UINT]: 'RG32_UINT',
  [DXGI_FORMAT_R32G32_SINT]: 'RG32_SINT',
  [DXGI_FORMAT_R32G32_FLOAT]: 'RG32_FLOAT',
  [DXGI_FORMAT_R16G16B16A16_UNORM]: 'RGBA16_UNORM',
  [DXGI_FORMAT_R16G16B16A16_SNORM]: 'RGBA16_SNORM',
  [DXGI_FORMAT_R16G16B16A16_UINT]: 'RGBA16_UINT',
  [DXGI_FORMAT_R16G16B16A16_SINT]: 'RGBA16_SINT',
  [DXGI_FORMAT_R16G16B16A16_FLOAT]: 'RGBA16_FLOAT',
  // 128-bit formats
  [DXGI_FORMAT_R32G32B32A32_UINT]: 'RGBA32_UINT',
  [DXGI_FORMAT_R32G32B32A32_SINT]: 'RGBA32_SINT',
  [DXGI_FORMAT_R32G32B32A32_FLOAT]: 'RGBA32_FLOAT',
  // BC
  [DXGI_FORMAT_BC1_UNORM]: 'BC1_RGBA_UNORM',
  [DXGI_FORMAT_BC2_UNORM]: 'BC2_RGBA_UNORM',
  [DXGI_FORMAT_BC3_UNORM]: 'BC3_RGBA_UNORM',
  [DXGI_FORMAT_BC1_UNORM_SRGB]: 'BC1_RGBA_UNORM_SRGB',
  [DXGI_FORMAT_BC2_UNORM_SRGB]: 'BC2_RGBA_UNORM_SRGB',
  [DXGI_FORMAT_BC3_UNORM_SRGB]: 'BC3_RGBA_UNORM_SRGB',
  [DXGI_FORMAT_BC4_UNORM]: 'BC4_R_UNORM',
  [DXGI_FORMAT_BC4_SNORM]: 'BC4_R_SNORM',
  [DXGI_FORMAT_BC5_UNORM]: 'BC5_RG_UNORM',
  [DXGI_FORMAT_BC5_SNORM]: 'BC5_RG_SNORM',
  [DXGI_FORMAT_BC6H_UF16]: 'BC6H_RGB_UFLOAT',
  [DXGI_FORMAT_BC6H_SF16]: 'BC6H_RGB_FLOAT',
  [DXGI_FORMAT_BC7_UNORM]: 'BC7_RGBA_UNORM',
  [DXGI_FORMAT_BC7_UNORM_SRGB]: 'BC7_RGBA_UNORM_SRGB',
  // ETC2 - none existing in DXGI
  // ASTC - none existing in DXGI
}

const VK_FORMAT_R4G4_UNORM_PACK8 = 1
const VK_FORMAT_R4G4B4A4_UNORM_PACK16 = 2
const VK_FORMAT_B4G4R4A4_UNORM_PACK16 = 3
const VK_FORMAT_R5G6B5_UNORM_PACK16 = 4
const VK_FORMAT_B5G6R5_UNORM_PACK16 = 5
const VK_FORMAT_R5G5B5A1_UNORM_PACK16 = 6
const VK_FORMAT_B5G5R5A1_UNORM_PACK16 = 7
const VK_FORMAT_A1R5G5B5_UNORM_PACK16 = 8
const VK_FORMAT_R8_UNORM = 9
const VK_FORMAT_R8_SNORM = 10
const VK_FORMAT_R8_USCALED = 11
const VK_FORMAT_R8_SSCALED = 12
const VK_FORMAT_R8_UINT = 13
const VK_FORMAT_R8_SINT = 14
const VK_FORMAT_R8_SRGB = 15
const VK_FORMAT_R8G8_UNORM = 16
const VK_FORMAT_R8G8_SNORM = 17
const VK_FORMAT_R8G8_USCALED = 18
const VK_FORMAT_R8G8_SSCALED = 19
const VK_FORMAT_R8G8_UINT = 20
const VK_FORMAT_R8G8_SINT = 21
const VK_FORMAT_R8G8_SRGB = 22
const VK_FORMAT_R8G8B8_UNORM = 23
const VK_FORMAT_R8G8B8_SNORM = 24
const VK_FORMAT_R8G8B8_USCALED = 25
const VK_FORMAT_R8G8B8_SSCALED = 26
const VK_FORMAT_R8G8B8_UINT = 27
const VK_FORMAT_R8G8B8_SINT = 28
const VK_FORMAT_R8G8B8_SRGB = 29
const VK_FORMAT_B8G8R8_UNORM = 30
const VK_FORMAT_B8G8R8_SNORM = 31
const VK_FORMAT_B8G8R8_USCALED = 32
const VK_FORMAT_B8G8R8_SSCALED = 33
const VK_FORMAT_B8G8R8_UINT = 34
const VK_FORMAT_B8G8R8_SINT = 35
const VK_FORMAT_B8G8R8_SRGB = 36
const VK_FORMAT_R8G8B8A8_UNORM = 37
const VK_FORMAT_R8G8B8A8_SNORM = 38
const VK_FORMAT_R8G8B8A8_USCALED = 39
const VK_FORMAT_R8G8B8A8_SSCALED = 40
const VK_FORMAT_R8G8B8A8_UINT = 41
const VK_FORMAT_R8G8B8A8_SINT = 42
const VK_FORMAT_R8G8B8A8_SRGB = 43
const VK_FORMAT_B8G8R8A8_UNORM = 44
const VK_FORMAT_B8G8R8A8_SNORM = 45
const VK_FORMAT_B8G8R8A8_USCALED = 46
const VK_FORMAT_B8G8R8A8_SSCALED = 47
const VK_FORMAT_B8G8R8A8_UINT = 48
const VK_FORMAT_B8G8R8A8_SINT = 49
const VK_FORMAT_B8G8R8A8_SRGB = 50
const VK_FORMAT_A8B8G8R8_UNORM_PACK32 = 51
const VK_FORMAT_A8B8G8R8_SNORM_PACK32 = 52
const VK_FORMAT_A8B8G8R8_USCALED_PACK32 = 53
const VK_FORMAT_A8B8G8R8_SSCALED_PACK32 = 54
const VK_FORMAT_A8B8G8R8_UINT_PACK32 = 55
const VK_FORMAT_A8B8G8R8_SINT_PACK32 = 56
const VK_FORMAT_A8B8G8R8_SRGB_PACK32 = 57
const VK_FORMAT_A2R10G10B10_UNORM_PACK32 = 58
const VK_FORMAT_A2R10G10B10_SNORM_PACK32 = 59
const VK_FORMAT_A2R10G10B10_USCALED_PACK32 = 60
const VK_FORMAT_A2R10G10B10_SSCALED_PACK32 = 61
const VK_FORMAT_A2R10G10B10_UINT_PACK32 = 62
const VK_FORMAT_A2R10G10B10_SINT_PACK32 = 63
const VK_FORMAT_A2B10G10R10_UNORM_PACK32 = 64
const VK_FORMAT_A2B10G10R10_SNORM_PACK32 = 65
const VK_FORMAT_A2B10G10R10_USCALED_PACK32 = 66
const VK_FORMAT_A2B10G10R10_SSCALED_PACK32 = 67
const VK_FORMAT_A2B10G10R10_UINT_PACK32 = 68
const VK_FORMAT_A2B10G10R10_SINT_PACK32 = 69
const VK_FORMAT_R16_UNORM = 70
const VK_FORMAT_R16_SNORM = 71
const VK_FORMAT_R16_USCALED = 72
const VK_FORMAT_R16_SSCALED = 73
const VK_FORMAT_R16_UINT = 74
const VK_FORMAT_R16_SINT = 75
const VK_FORMAT_R16_SFLOAT = 76
const VK_FORMAT_R16G16_UNORM = 77
const VK_FORMAT_R16G16_SNORM = 78
const VK_FORMAT_R16G16_USCALED = 79
const VK_FORMAT_R16G16_SSCALED = 80
const VK_FORMAT_R16G16_UINT = 81
const VK_FORMAT_R16G16_SINT = 82
const VK_FORMAT_R16G16_SFLOAT = 83
const VK_FORMAT_R16G16B16_UNORM = 84
const VK_FORMAT_R16G16B16_SNORM = 85
const VK_FORMAT_R16G16B16_USCALED = 86
const VK_FORMAT_R16G16B16_SSCALED = 87
const VK_FORMAT_R16G16B16_UINT = 88
const VK_FORMAT_R16G16B16_SINT = 89
const VK_FORMAT_R16G16B16_SFLOAT = 90
const VK_FORMAT_R16G16B16A16_UNORM = 91
const VK_FORMAT_R16G16B16A16_SNORM = 92
const VK_FORMAT_R16G16B16A16_USCALED = 93
const VK_FORMAT_R16G16B16A16_SSCALED = 94
const VK_FORMAT_R16G16B16A16_UINT = 95
const VK_FORMAT_R16G16B16A16_SINT = 96
const VK_FORMAT_R16G16B16A16_SFLOAT = 97
const VK_FORMAT_R32_UINT = 98
const VK_FORMAT_R32_SINT = 99
const VK_FORMAT_R32_SFLOAT = 100
const VK_FORMAT_R32G32_UINT = 101
const VK_FORMAT_R32G32_SINT = 102
const VK_FORMAT_R32G32_SFLOAT = 103
const VK_FORMAT_R32G32B32_UINT = 104
const VK_FORMAT_R32G32B32_SINT = 105
const VK_FORMAT_R32G32B32_SFLOAT = 106
const VK_FORMAT_R32G32B32A32_UINT = 107
const VK_FORMAT_R32G32B32A32_SINT = 108
const VK_FORMAT_R32G32B32A32_SFLOAT = 109
const VK_FORMAT_R64_UINT = 110
const VK_FORMAT_R64_SINT = 111
const VK_FORMAT_R64_SFLOAT = 112
const VK_FORMAT_R64G64_UINT = 113
const VK_FORMAT_R64G64_SINT = 114
const VK_FORMAT_R64G64_SFLOAT = 115
const VK_FORMAT_R64G64B64_UINT = 116
const VK_FORMAT_R64G64B64_SINT = 117
const VK_FORMAT_R64G64B64_SFLOAT = 118
const VK_FORMAT_R64G64B64A64_UINT = 119
const VK_FORMAT_R64G64B64A64_SINT = 120
const VK_FORMAT_R64G64B64A64_SFLOAT = 121
const VK_FORMAT_B10G11R11_UFLOAT_PACK32 = 122
const VK_FORMAT_E5B9G9R9_UFLOAT_PACK32 = 123
const VK_FORMAT_D16_UNORM = 124
const VK_FORMAT_X8_D24_UNORM_PACK32 = 125
const VK_FORMAT_D32_SFLOAT = 126
const VK_FORMAT_S8_UINT = 127
const VK_FORMAT_D16_UNORM_S8_UINT = 128
const VK_FORMAT_D24_UNORM_S8_UINT = 129
const VK_FORMAT_D32_SFLOAT_S8_UINT = 130
const VK_FORMAT_BC1_RGB_UNORM_BLOCK = 131
const VK_FORMAT_BC1_RGB_SRGB_BLOCK = 132
const VK_FORMAT_BC1_RGBA_UNORM_BLOCK = 133
const VK_FORMAT_BC1_RGBA_SRGB_BLOCK = 134
const VK_FORMAT_BC2_UNORM_BLOCK = 135
const VK_FORMAT_BC2_SRGB_BLOCK = 136
const VK_FORMAT_BC3_UNORM_BLOCK = 137
const VK_FORMAT_BC3_SRGB_BLOCK = 138
const VK_FORMAT_BC4_UNORM_BLOCK = 139
const VK_FORMAT_BC4_SNORM_BLOCK = 140
const VK_FORMAT_BC5_UNORM_BLOCK = 141
const VK_FORMAT_BC5_SNORM_BLOCK = 142
const VK_FORMAT_BC6H_UFLOAT_BLOCK = 143
const VK_FORMAT_BC6H_SFLOAT_BLOCK = 144
const VK_FORMAT_BC7_UNORM_BLOCK = 145
const VK_FORMAT_BC7_SRGB_BLOCK = 146
const VK_FORMAT_ETC2_R8G8B8_UNORM_BLOCK = 147
const VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK = 148
const VK_FORMAT_ETC2_R8G8B8A1_UNORM_BLOCK = 149
const VK_FORMAT_ETC2_R8G8B8A1_SRGB_BLOCK = 150
const VK_FORMAT_ETC2_R8G8B8A8_UNORM_BLOCK = 151
const VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK = 152
const VK_FORMAT_EAC_R11_UNORM_BLOCK = 153
const VK_FORMAT_EAC_R11_SNORM_BLOCK = 154
const VK_FORMAT_EAC_R11G11_UNORM_BLOCK = 155
const VK_FORMAT_EAC_R11G11_SNORM_BLOCK = 156
const VK_FORMAT_ASTC_4x4_UNORM_BLOCK = 157
const VK_FORMAT_ASTC_4x4_SRGB_BLOCK = 158
const VK_FORMAT_ASTC_5x4_UNORM_BLOCK = 159
const VK_FORMAT_ASTC_5x4_SRGB_BLOCK = 160
const VK_FORMAT_ASTC_5x5_UNORM_BLOCK = 161
const VK_FORMAT_ASTC_5x5_SRGB_BLOCK = 162
const VK_FORMAT_ASTC_6x5_UNORM_BLOCK = 163
const VK_FORMAT_ASTC_6x5_SRGB_BLOCK = 164
const VK_FORMAT_ASTC_6x6_UNORM_BLOCK = 165
const VK_FORMAT_ASTC_6x6_SRGB_BLOCK = 166
const VK_FORMAT_ASTC_8x5_UNORM_BLOCK = 167
const VK_FORMAT_ASTC_8x5_SRGB_BLOCK = 168
const VK_FORMAT_ASTC_8x6_UNORM_BLOCK = 169
const VK_FORMAT_ASTC_8x6_SRGB_BLOCK = 170
const VK_FORMAT_ASTC_8x8_UNORM_BLOCK = 171
const VK_FORMAT_ASTC_8x8_SRGB_BLOCK = 172
const VK_FORMAT_ASTC_10x5_UNORM_BLOCK = 173
const VK_FORMAT_ASTC_10x5_SRGB_BLOCK = 174
const VK_FORMAT_ASTC_10x6_UNORM_BLOCK = 175
const VK_FORMAT_ASTC_10x6_SRGB_BLOCK = 176
const VK_FORMAT_ASTC_10x8_UNORM_BLOCK = 177
const VK_FORMAT_ASTC_10x8_SRGB_BLOCK = 178
const VK_FORMAT_ASTC_10x10_UNORM_BLOCK = 179
const VK_FORMAT_ASTC_10x10_SRGB_BLOCK = 180
const VK_FORMAT_ASTC_12x10_UNORM_BLOCK = 181
const VK_FORMAT_ASTC_12x10_SRGB_BLOCK = 182
const VK_FORMAT_ASTC_12x12_UNORM_BLOCK = 183
const VK_FORMAT_ASTC_12x12_SRGB_BLOCK = 184

const mapFromVulkan: Record<number, SurfaceFormat> = {
  // 8-bit formats
  [VK_FORMAT_R8_UNORM]: 'R8_UNORM',
  [VK_FORMAT_R8_SNORM]: 'R8_SNORM',
  [VK_FORMAT_R8_UINT]: 'R8_UINT',
  [VK_FORMAT_R8_SINT]: 'R8_SINT',

  // 16-bit formats
  [VK_FORMAT_R16_UNORM]: 'R16_UNORM',
  [VK_FORMAT_R16_SNORM]: 'R16_SNORM',
  [VK_FORMAT_R16_UINT]: 'R16_UINT',
  [VK_FORMAT_R16_SINT]: 'R16_SINT',
  [VK_FORMAT_R16_SFLOAT]: 'R16_FLOAT',
  [VK_FORMAT_R8G8_UNORM]: 'RG8_UNORM',
  [VK_FORMAT_R8G8_SNORM]: 'RG8_SNORM',
  [VK_FORMAT_R8G8_UINT]: 'RG8_UINT',
  [VK_FORMAT_R8G8_SINT]: 'RG8_SINT',

  // 32-bit formats
  [VK_FORMAT_R32_UINT]: 'R32_UINT',
  [VK_FORMAT_R32_SINT]: 'R32_SINT',
  [VK_FORMAT_R32_SFLOAT]: 'R32_FLOAT',
  [VK_FORMAT_R16G16_UNORM]: 'RG16_UNORM',
  [VK_FORMAT_R16G16_SNORM]: 'RG16_SNORM',
  [VK_FORMAT_R16G16_UINT]: 'RG16_UINT',
  [VK_FORMAT_R16G16_SINT]: 'RG16_SINT',
  [VK_FORMAT_R16G16_SFLOAT]: 'RG16_FLOAT',

  [VK_FORMAT_R8G8B8A8_UNORM]: 'RGBA8_UNORM',
  [VK_FORMAT_R8G8B8A8_SRGB]: 'RGBA8_UNORM_SRGB',
  [VK_FORMAT_R8G8B8A8_SNORM]: 'RGBA8_SNORM',
  [VK_FORMAT_R8G8B8A8_UINT]: 'RGBA8_UINT',
  [VK_FORMAT_R8G8B8A8_SINT]: 'RGBA8_SINT',
  [VK_FORMAT_B8G8R8A8_UNORM]: 'BGRA8_UNORM',
  [VK_FORMAT_B8G8R8A8_SRGB]: 'BGRA8_UNORM_SRGB',

  // Packed 32-bit formats
  // 64-bit formats
  [VK_FORMAT_R32G32_UINT]: 'RG32_UINT',
  [VK_FORMAT_R32G32_SINT]: 'RG32_SINT',
  [VK_FORMAT_R32G32_SFLOAT]: 'RG32_FLOAT',
  [VK_FORMAT_R16G16B16A16_UNORM]: 'RGBA16_UNORM',
  [VK_FORMAT_R16G16B16A16_SNORM]: 'RGBA16_SNORM',
  [VK_FORMAT_R16G16B16A16_UINT]: 'RGBA16_UINT',
  [VK_FORMAT_R16G16B16A16_SINT]: 'RGBA16_SINT',
  [VK_FORMAT_R16G16B16A16_SFLOAT]: 'RGBA16_FLOAT',

  // 128-bit formats
  [VK_FORMAT_R32G32B32A32_UINT]: 'RGBA32_UINT',
  [VK_FORMAT_R32G32B32A32_SINT]: 'RGBA32_SINT',
  [VK_FORMAT_R32G32B32A32_SFLOAT]: 'RGBA32_FLOAT',
  // Depth/stencil formats
  [VK_FORMAT_S8_UINT]: 'STENCIL8',
  [VK_FORMAT_D16_UNORM]: 'DEPTH16_UNORM',
  [VK_FORMAT_D24_UNORM_S8_UINT]: 'DEPTH24_PLUS_STENCIL8',
  [VK_FORMAT_D32_SFLOAT]: 'DEPTH32_FLOAT',
  [VK_FORMAT_D32_SFLOAT_S8_UINT]: 'DEPTH32_FLOAT_STENCIL8',
  // BC
  [VK_FORMAT_BC1_RGBA_UNORM_BLOCK]: 'BC1_RGBA_UNORM',
  [VK_FORMAT_BC2_UNORM_BLOCK]: 'BC2_RGBA_UNORM',
  [VK_FORMAT_BC3_UNORM_BLOCK]: 'BC3_RGBA_UNORM',
  [VK_FORMAT_BC1_RGBA_SRGB_BLOCK]: 'BC1_RGBA_UNORM_SRGB',
  [VK_FORMAT_BC2_SRGB_BLOCK]: 'BC2_RGBA_UNORM_SRGB',
  [VK_FORMAT_BC3_SRGB_BLOCK]: 'BC3_RGBA_UNORM_SRGB',
  [VK_FORMAT_BC4_UNORM_BLOCK]: 'BC4_R_UNORM',
  [VK_FORMAT_BC4_SNORM_BLOCK]: 'BC4_R_SNORM',
  [VK_FORMAT_BC5_UNORM_BLOCK]: 'BC5_RG_UNORM',
  [VK_FORMAT_BC5_SNORM_BLOCK]: 'BC5_RG_SNORM',
  [VK_FORMAT_BC6H_UFLOAT_BLOCK]: 'BC6H_RGB_UFLOAT',
  [VK_FORMAT_BC6H_SFLOAT_BLOCK]: 'BC6H_RGB_FLOAT',
  [VK_FORMAT_BC7_UNORM_BLOCK]: 'BC7_RGBA_UNORM',
  [VK_FORMAT_BC7_SRGB_BLOCK]: 'BC7_RGBA_UNORM_SRGB',
  // ETC2
  [VK_FORMAT_ETC2_R8G8B8_UNORM_BLOCK]: 'ETC2_RGB8_UNORM',
  [VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK]: 'ETC2_RGB8_UNORM_SRGB',
  [VK_FORMAT_ETC2_R8G8B8A1_UNORM_BLOCK]: 'ETC2_RGB8_A1_UNORM',
  [VK_FORMAT_ETC2_R8G8B8A1_SRGB_BLOCK]: 'ETC2_RGB8_A1_UNORM_SRGB',
  [VK_FORMAT_ETC2_R8G8B8A8_UNORM_BLOCK]: 'ETC2_RGBA8_UNORM',
  [VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK]: 'ETC2_RGBA8_UNORM_SRGB',
  // EAC
  [VK_FORMAT_EAC_R11_UNORM_BLOCK]: 'EAC_R11_UNORM',
  [VK_FORMAT_EAC_R11_SNORM_BLOCK]: 'EAC_R11_SNORM',
  [VK_FORMAT_EAC_R11G11_UNORM_BLOCK]: 'EAC_RG11_UNORM',
  [VK_FORMAT_EAC_R11G11_SNORM_BLOCK]: 'EAC_RG11_SNORM',
  // ASTC
  [VK_FORMAT_ASTC_4x4_UNORM_BLOCK]: 'ASTC_4x4_UNORM',
  [VK_FORMAT_ASTC_4x4_SRGB_BLOCK]: 'ASTC_4x4_UNORM_SRGB',
  [VK_FORMAT_ASTC_5x4_UNORM_BLOCK]: 'ASTC_5x4_UNORM',
  [VK_FORMAT_ASTC_5x4_SRGB_BLOCK]: 'ASTC_5x4_UNORM_SRGB',
  [VK_FORMAT_ASTC_5x5_UNORM_BLOCK]: 'ASTC_5x5_UNORM',
  [VK_FORMAT_ASTC_5x5_SRGB_BLOCK]: 'ASTC_5x5_UNORM_SRGB',
  [VK_FORMAT_ASTC_6x5_UNORM_BLOCK]: 'ASTC_6x5_UNORM',
  [VK_FORMAT_ASTC_6x5_SRGB_BLOCK]: 'ASTC_6x5_UNORM_SRGB',
  [VK_FORMAT_ASTC_6x6_UNORM_BLOCK]: 'ASTC_6x6_UNORM',
  [VK_FORMAT_ASTC_6x6_SRGB_BLOCK]: 'ASTC_6x6_UNORM_SRGB',
  [VK_FORMAT_ASTC_8x5_UNORM_BLOCK]: 'ASTC_8x5_UNORM',
  [VK_FORMAT_ASTC_8x5_SRGB_BLOCK]: 'ASTC_8x5_UNORM_SRGB',
  [VK_FORMAT_ASTC_8x6_UNORM_BLOCK]: 'ASTC_8x6_UNORM',
  [VK_FORMAT_ASTC_8x6_SRGB_BLOCK]: 'ASTC_8x6_UNORM_SRGB',
  [VK_FORMAT_ASTC_8x8_UNORM_BLOCK]: 'ASTC_8x8_UNORM',
  [VK_FORMAT_ASTC_8x8_SRGB_BLOCK]: 'ASTC_8x8_UNORM_SRGB',
  [VK_FORMAT_ASTC_10x5_UNORM_BLOCK]: 'ASTC_10x5_UNORM',
  [VK_FORMAT_ASTC_10x5_SRGB_BLOCK]: 'ASTC_10x5_UNORM_SRGB',
  [VK_FORMAT_ASTC_10x6_UNORM_BLOCK]: 'ASTC_10x6_UNORM',
  [VK_FORMAT_ASTC_10x6_SRGB_BLOCK]: 'ASTC_10x6_UNORM_SRGB',
  [VK_FORMAT_ASTC_10x8_UNORM_BLOCK]: 'ASTC_10x8_UNORM',
  [VK_FORMAT_ASTC_10x8_SRGB_BLOCK]: 'ASTC_10x8_UNORM_SRGB',
  [VK_FORMAT_ASTC_10x10_UNORM_BLOCK]: 'ASTC_10x10_UNORM',
  [VK_FORMAT_ASTC_10x10_SRGB_BLOCK]: 'ASTC_10x10_UNORM_SRGB',
  [VK_FORMAT_ASTC_12x10_UNORM_BLOCK]: 'ASTC_12x10_UNORM',
  [VK_FORMAT_ASTC_12x10_SRGB_BLOCK]: 'ASTC_12x10_UNORM_SRGB',
  [VK_FORMAT_ASTC_12x12_UNORM_BLOCK]: 'ASTC_12x12_UNORM',
  [VK_FORMAT_ASTC_12x12_SRGB_BLOCK]: 'ASTC_12x12_UNORM_SRGB',
}

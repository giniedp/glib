import { type DataType, dataTypeToWebGL } from './DataType'
import { GLConst as gl } from './GLConst'
export type TextureCompression = 'astc' | 'etc1' | 'etc2' | 'pvrtc' | 'bptc' | 'bc'

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

export type DepthStencilFormat = Extract<
  SurfaceFormat,
  'STENCIL8' | 'DEPTH16_UNORM' | 'DEPTH24_PLUS' | 'DEPTH24_PLUS_STENCIL8' | 'DEPTH32_FLOAT' | 'DEPTH32_FLOAT_STENCIL8'
>

export function surfaceIsDepthStencilFormat(format: SurfaceFormat): format is DepthStencilFormat {
  return surfaceIsDepthFormat(format) || surfaceIsStencilFormat(format)
}

export function surfaceIsDepthFormat(format: SurfaceFormat): boolean {
  switch (format) {
    case 'DEPTH16_UNORM':
    case 'DEPTH24_PLUS':
    case 'DEPTH24_PLUS_STENCIL8':
    case 'DEPTH32_FLOAT':
    case 'DEPTH32_FLOAT_STENCIL8':
      return true
    default:
      return false
  }
}

export function surfaceIsStencilFormat(format: SurfaceFormat): boolean {
  switch (format) {
    case 'STENCIL8':
    case 'DEPTH24_PLUS_STENCIL8':
    case 'DEPTH32_FLOAT_STENCIL8':
      return true
    default:
      return false
  }
}

export type SurfaceFormatInfo = {
  srgb: boolean
  compression: TextureCompression | null
  components: number
  bytesPerPixel: number | null // null for compressed formats
  bytesPerBlock: number
  blockWidth: number
  blockHeight: number
  type: DataType | null // null for compressed or packed formats
}

function formatInfo(bpp: number, type: DataType, components: number, srgb?: boolean): SurfaceFormatInfo {
  return Object.freeze({
    srgb: !!srgb,
    compression: null,
    components,
    blockWidth: 1,
    blockHeight: 1,
    bytesPerBlock: bpp,
    bytesPerPixel: bpp,
    type,
  })
}

function compressedInfo(
  compression: TextureCompression,
  components: number,
  block: readonly [number, number, number],
  srgb?: boolean,
): SurfaceFormatInfo {
  const [blockWidth, blockHeight, bytesPerBlock] = block
  return Object.freeze({
    srgb: !!srgb,
    compression: compression,
    components,
    bytesPerPixel: null,
    blockWidth,
    blockHeight,
    bytesPerBlock,
    type: null,
  })
}

const block = {
  bc1: [4, 4, 8],
  bc2: [4, 4, 16],
  bc3: [4, 4, 16],
  bc4: [4, 4, 8],
  bc5: [4, 4, 16],
  bc6h: [4, 4, 16],
  bc7: [4, 4, 16],
  astc4x4: [4, 4, 16],
  astc5x4: [5, 4, 16],
  astc5x5: [5, 5, 16],
  astc6x5: [6, 5, 16],
  astc6x6: [6, 6, 16],
  astc8x5: [8, 5, 16],
  astc8x6: [8, 6, 16],
  astc8x8: [8, 8, 16],
  astc10x5: [10, 5, 16],
  astc10x6: [10, 6, 16],
  astc10x8: [10, 8, 16],
  astc10x10: [10, 10, 16],
  astc12x10: [12, 10, 16],
  astc12x12: [12, 12, 16],
} as const

const surfaceInfoMap: Record<SurfaceFormat, SurfaceFormatInfo> = {
  // 8-bit formats
  R8_UNORM: formatInfo(1, 'uint8', 1),
  R8_SNORM: formatInfo(1, 'uint8', 1),
  R8_UINT: formatInfo(1, 'uint8', 1),
  R8_SINT: formatInfo(1, 'uint8', 1),
  // 16-bit formats
  R16_UNORM: formatInfo(2, 'uint16', 1),
  R16_SNORM: formatInfo(2, 'uint16', 1),
  R16_UINT: formatInfo(2, 'uint16', 1),
  R16_SINT: formatInfo(2, 'uint16', 1),
  R16_FLOAT: formatInfo(2, 'float16', 1),
  RG8_UNORM: formatInfo(2, 'uint8', 2),
  RG8_SNORM: formatInfo(2, 'uint8', 2),
  RG8_UINT: formatInfo(2, 'uint8', 2),
  RG8_SINT: formatInfo(2, 'uint8', 2),
  // 32-bit formats
  R32_UINT: formatInfo(4, 'uint32', 1),
  R32_SINT: formatInfo(4, 'uint32', 1),
  R32_FLOAT: formatInfo(4, 'float32', 1),
  RG16_UNORM: formatInfo(4, 'uint16', 2),
  RG16_SNORM: formatInfo(4, 'uint16', 2),
  RG16_UINT: formatInfo(4, 'uint16', 2),
  RG16_SINT: formatInfo(4, 'uint16', 2),
  RG16_FLOAT: formatInfo(4, 'float16', 2),
  RGBA8_UNORM: formatInfo(4, 'uint8', 4),
  RGBA8_UNORM_SRGB: formatInfo(4, 'uint8', 4, true),
  RGBA8_SNORM: formatInfo(4, 'uint8', 4),
  RGBA8_UINT: formatInfo(4, 'uint8', 4),
  RGBA8_SINT: formatInfo(4, 'uint8', 4),
  BGRA8_UNORM: formatInfo(4, 'uint8', 4),
  BGRA8_UNORM_SRGB: formatInfo(4, 'uint8', 4, true),
  // Packed 32-bit formats
  RGB9_E5_UFLOAT: formatInfo(4, null, 3),
  RGB10_A2_UINT: formatInfo(4, null, 4),
  RGB10_A2_UNORM: formatInfo(4, null, 4),
  RG11_B10_UFLOAT: formatInfo(4, null, 3),
  // 64-bit formats
  RG32_UINT: formatInfo(8, 'uint32', 2),
  RG32_SINT: formatInfo(8, 'uint32', 2),
  RG32_FLOAT: formatInfo(8, 'float32', 2),
  RGBA16_UNORM: formatInfo(8, 'uint16', 4),
  RGBA16_SNORM: formatInfo(8, 'uint16', 4),
  RGBA16_UINT: formatInfo(8, 'uint16', 4),
  RGBA16_SINT: formatInfo(8, 'uint16', 4),
  RGBA16_FLOAT: formatInfo(8, 'float16', 4),
  // 128-bit formats
  RGBA32_UINT: formatInfo(16, 'uint32', 4),
  RGBA32_SINT: formatInfo(16, 'uint32', 4),
  RGBA32_FLOAT: formatInfo(16, 'float32', 4),
  // Depth/stencil formats
  STENCIL8: formatInfo(1, null, 1),
  DEPTH16_UNORM: formatInfo(2, null, 1),
  DEPTH24_PLUS: formatInfo(4, null, 1),
  DEPTH24_PLUS_STENCIL8: formatInfo(4, null, 2),
  DEPTH32_FLOAT: formatInfo(4, null, 1),
  DEPTH32_FLOAT_STENCIL8: formatInfo(8, null, 2),
  // BC
  BC1_RGBA_UNORM: compressedInfo('bc', 4, block.bc1),
  BC2_RGBA_UNORM: compressedInfo('bc', 4, block.bc2),
  BC3_RGBA_UNORM: compressedInfo('bc', 4, block.bc3),
  BC1_RGBA_UNORM_SRGB: compressedInfo('bc', 4, block.bc1, true),
  BC2_RGBA_UNORM_SRGB: compressedInfo('bc', 4, block.bc2, true),
  BC3_RGBA_UNORM_SRGB: compressedInfo('bc', 4, block.bc3, true),
  BC4_R_UNORM: compressedInfo('bc', 1, block.bc4),
  BC4_R_SNORM: compressedInfo('bc', 1, block.bc4),
  BC5_RG_UNORM: compressedInfo('bc', 2, block.bc5),
  BC5_RG_SNORM: compressedInfo('bc', 2, block.bc5),
  BC6H_RGB_UFLOAT: compressedInfo('bc', 3, block.bc6h),
  BC6H_RGB_FLOAT: compressedInfo('bc', 3, block.bc6h),
  BC7_RGBA_UNORM: compressedInfo('bc', 4, block.bc7),
  BC7_RGBA_UNORM_SRGB: compressedInfo('bc', 4, block.bc7, true),
  // ETC2
  EAC_R11_UNORM: compressedInfo('etc2', 1, [4, 4, 8]),
  EAC_R11_SNORM: compressedInfo('etc2', 1, [4, 4, 8]),
  EAC_RG11_UNORM: compressedInfo('etc2', 2, [4, 4, 16]),
  EAC_RG11_SNORM: compressedInfo('etc2', 2, [4, 4, 16]),
  ETC2_RGB8_UNORM: compressedInfo('etc2', 3, [4, 4, 8]),
  ETC2_RGB8_A1_UNORM: compressedInfo('etc2', 4, [4, 4, 8]),
  ETC2_RGBA8_UNORM: compressedInfo('etc2', 4, [4, 4, 16]),
  ETC2_RGB8_UNORM_SRGB: compressedInfo('etc2', 3, [4, 4, 8], true),
  ETC2_RGB8_A1_UNORM_SRGB: compressedInfo('etc2', 4, [4, 4, 8], true),
  ETC2_RGBA8_UNORM_SRGB: compressedInfo('etc2', 4, [4, 4, 16], true),
  // ASTC
  ASTC_4x4_UNORM: compressedInfo('astc', 4, block.astc4x4),
  ASTC_5x4_UNORM: compressedInfo('astc', 4, block.astc5x4),
  ASTC_5x5_UNORM: compressedInfo('astc', 4, block.astc5x5),
  ASTC_6x5_UNORM: compressedInfo('astc', 4, block.astc6x5),
  ASTC_6x6_UNORM: compressedInfo('astc', 4, block.astc6x6),
  ASTC_8x5_UNORM: compressedInfo('astc', 4, block.astc8x5),
  ASTC_8x6_UNORM: compressedInfo('astc', 4, block.astc8x6),
  ASTC_8x8_UNORM: compressedInfo('astc', 4, block.astc8x8),
  ASTC_10x5_UNORM: compressedInfo('astc', 4, block.astc10x5),
  ASTC_10x6_UNORM: compressedInfo('astc', 4, block.astc10x6),
  ASTC_10x8_UNORM: compressedInfo('astc', 4, block.astc10x8),
  ASTC_10x10_UNORM: compressedInfo('astc', 4, block.astc10x10),
  ASTC_12x10_UNORM: compressedInfo('astc', 4, block.astc12x10),
  ASTC_12x12_UNORM: compressedInfo('astc', 4, block.astc12x12),

  ASTC_4x4_UNORM_SRGB: compressedInfo('astc', 4, block.astc4x4, true),
  ASTC_5x4_UNORM_SRGB: compressedInfo('astc', 4, block.astc5x4, true),
  ASTC_5x5_UNORM_SRGB: compressedInfo('astc', 4, block.astc5x5, true),
  ASTC_6x5_UNORM_SRGB: compressedInfo('astc', 4, block.astc6x5, true),
  ASTC_6x6_UNORM_SRGB: compressedInfo('astc', 4, block.astc6x6, true),
  ASTC_8x5_UNORM_SRGB: compressedInfo('astc', 4, block.astc8x5, true),
  ASTC_8x6_UNORM_SRGB: compressedInfo('astc', 4, block.astc8x6, true),
  ASTC_8x8_UNORM_SRGB: compressedInfo('astc', 4, block.astc8x8, true),
  ASTC_10x5_UNORM_SRGB: compressedInfo('astc', 4, block.astc10x5, true),
  ASTC_10x6_UNORM_SRGB: compressedInfo('astc', 4, block.astc10x6, true),
  ASTC_10x8_UNORM_SRGB: compressedInfo('astc', 4, block.astc10x8, true),
  ASTC_10x10_UNORM_SRGB: compressedInfo('astc', 4, block.astc10x10, true),
  ASTC_12x10_UNORM_SRGB: compressedInfo('astc', 4, block.astc12x10, true),
  ASTC_12x12_UNORM_SRGB: compressedInfo('astc', 4, block.astc12x12, true),
}

export function surfaceFormatInfo(format: SurfaceFormat): SurfaceFormatInfo {
  return surfaceInfoMap[format]
}

export function surfaceFormatIsCompressed(format: SurfaceFormat): boolean {
  return !!surfaceFormatInfo(format)?.compression
}

export function surfaceFormatIsSrgb(format: SurfaceFormat): boolean {
  return !!surfaceFormatInfo(format)?.srgb
}

export function surfaceFormatDataType(format: SurfaceFormat): DataType | null {
  return surfaceFormatInfo(format)?.type || null
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

export function surfaceFormatFromWebGPU(format: GPUTextureFormat): SurfaceFormat {
  return mapFromGPU[format]
}

export function surfaceFormatFromWebGL(format: number): SurfaceFormat {
  return mapFromWebGL[format]
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

const mapFromWebGL: Record<number, SurfaceFormat> = Object.fromEntries(
  Object.entries(mapToWebGL).map(([format, glFormat]) => [glFormat, format as SurfaceFormat]),
)

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
  R16_UNORM: 'r16unorm',
  R16_SNORM: 'r16snorm',
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
  RG16_UNORM: 'rg16unorm',
  RG16_SNORM: 'rg16snorm',
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
  RGB9_E5_UFLOAT: 'rgb9e5ufloat',
  RGB10_A2_UINT: 'rgb10a2uint',
  RGB10_A2_UNORM: 'rgb10a2unorm',
  RG11_B10_UFLOAT: 'rg11b10ufloat',
  // 64-bit formats
  RG32_UINT: 'rg32uint',
  RG32_SINT: 'rg32sint',
  RG32_FLOAT: 'rg32float',
  RGBA16_UNORM: 'rgba16unorm',
  RGBA16_SNORM: 'rgba16snorm',
  RGBA16_UINT: 'rgba16uint',
  RGBA16_SINT: 'rgba16sint',
  RGBA16_FLOAT: 'rgba16float',
  // 128-bit formats
  RGBA32_UINT: 'rgba32uint',
  RGBA32_SINT: 'rgba32sint',
  RGBA32_FLOAT: 'rgba32float',
  // Depth/stencil formats
  STENCIL8: 'stencil8',
  DEPTH16_UNORM: 'depth16unorm',
  DEPTH24_PLUS: 'depth24plus',
  DEPTH24_PLUS_STENCIL8: 'depth24plus-stencil8',
  DEPTH32_FLOAT: 'depth32float',
  DEPTH32_FLOAT_STENCIL8: 'depth32float-stencil8',
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
  BC6H_RGB_FLOAT: 'bc6h-rgb-float',
  BC7_RGBA_UNORM: 'bc7-rgba-unorm',
  BC7_RGBA_UNORM_SRGB: 'bc7-rgba-unorm-srgb',
  // ETC2
  EAC_R11_UNORM: 'eac-r11unorm',
  EAC_R11_SNORM: 'eac-r11snorm',
  EAC_RG11_UNORM: 'eac-rg11unorm',
  EAC_RG11_SNORM: 'eac-rg11snorm',
  ETC2_RGB8_UNORM: 'etc2-rgb8unorm',
  ETC2_RGB8_UNORM_SRGB: 'etc2-rgb8unorm-srgb',
  ETC2_RGB8_A1_UNORM: 'etc2-rgb8a1unorm',
  ETC2_RGB8_A1_UNORM_SRGB: 'etc2-rgb8a1unorm-srgb',
  ETC2_RGBA8_UNORM: 'etc2-rgba8unorm',
  ETC2_RGBA8_UNORM_SRGB: 'etc2-rgba8unorm-srgb',
  // ASTC
  ASTC_4x4_UNORM: 'astc-4x4-unorm',
  ASTC_4x4_UNORM_SRGB: 'astc-4x4-unorm-srgb',
  ASTC_5x4_UNORM: 'astc-5x4-unorm',
  ASTC_5x4_UNORM_SRGB: 'astc-5x4-unorm-srgb',
  ASTC_5x5_UNORM: 'astc-5x5-unorm',
  ASTC_5x5_UNORM_SRGB: 'astc-5x5-unorm-srgb',
  ASTC_6x5_UNORM: 'astc-6x5-unorm',
  ASTC_6x5_UNORM_SRGB: 'astc-6x5-unorm-srgb',
  ASTC_6x6_UNORM: 'astc-6x6-unorm',
  ASTC_6x6_UNORM_SRGB: 'astc-6x6-unorm-srgb',
  ASTC_8x5_UNORM: 'astc-8x5-unorm',
  ASTC_8x5_UNORM_SRGB: 'astc-8x5-unorm-srgb',
  ASTC_8x6_UNORM: 'astc-8x6-unorm',
  ASTC_8x6_UNORM_SRGB: 'astc-8x6-unorm-srgb',
  ASTC_8x8_UNORM: 'astc-8x8-unorm',
  ASTC_8x8_UNORM_SRGB: 'astc-8x8-unorm-srgb',
  ASTC_10x5_UNORM: 'astc-10x5-unorm',
  ASTC_10x5_UNORM_SRGB: 'astc-10x5-unorm-srgb',
  ASTC_10x6_UNORM: 'astc-10x6-unorm',
  ASTC_10x6_UNORM_SRGB: 'astc-10x6-unorm-srgb',
  ASTC_10x8_UNORM: 'astc-10x8-unorm',
  ASTC_10x8_UNORM_SRGB: 'astc-10x8-unorm-srgb',
  ASTC_10x10_UNORM: 'astc-10x10-unorm',
  ASTC_10x10_UNORM_SRGB: 'astc-10x10-unorm-srgb',
  ASTC_12x10_UNORM: 'astc-12x10-unorm',
  ASTC_12x10_UNORM_SRGB: 'astc-12x10-unorm-srgb',
  ASTC_12x12_UNORM: 'astc-12x12-unorm',
  ASTC_12x12_UNORM_SRGB: 'astc-12x12-unorm-srgb',
}

const mapFromGPU: Record<GPUTextureFormat, SurfaceFormat> = Object.fromEntries(
  Object.entries(mapToWebGPU).map(([k, v]) => [v, k as SurfaceFormat]),
) as any

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

// @ts-ignore
const DXGI_FORMAT_R32G32B32A32_TYPELESS = 1
// @ts-ignore
const DXGI_FORMAT_R32G32B32A32_FLOAT = 2
// @ts-ignore
const DXGI_FORMAT_R32G32B32A32_UINT = 3
// @ts-ignore
const DXGI_FORMAT_R32G32B32A32_SINT = 4
// @ts-ignore
const DXGI_FORMAT_R32G32B32_TYPELESS = 5
// @ts-ignore
const DXGI_FORMAT_R32G32B32_FLOAT = 6
// @ts-ignore
const DXGI_FORMAT_R32G32B32_UINT = 7
// @ts-ignore
const DXGI_FORMAT_R32G32B32_SINT = 8
// @ts-ignore
const DXGI_FORMAT_R16G16B16A16_TYPELESS = 9
// @ts-ignore
const DXGI_FORMAT_R16G16B16A16_FLOAT = 10
// @ts-ignore
const DXGI_FORMAT_R16G16B16A16_UNORM = 11
// @ts-ignore
const DXGI_FORMAT_R16G16B16A16_UINT = 12
// @ts-ignore
const DXGI_FORMAT_R16G16B16A16_SNORM = 13
// @ts-ignore
const DXGI_FORMAT_R16G16B16A16_SINT = 14
// @ts-ignore
const DXGI_FORMAT_R32G32_TYPELESS = 15
// @ts-ignore
const DXGI_FORMAT_R32G32_FLOAT = 16
// @ts-ignore
const DXGI_FORMAT_R32G32_UINT = 17
// @ts-ignore
const DXGI_FORMAT_R32G32_SINT = 18
// @ts-ignore
const DXGI_FORMAT_R32G8X24_TYPELESS = 19
// @ts-ignore
const DXGI_FORMAT_D32_FLOAT_S8X24_UINT = 20
// @ts-ignore
const DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS = 21
// @ts-ignore
const DXGI_FORMAT_X32_TYPELESS_G8X24_UINT = 22
// @ts-ignore
const DXGI_FORMAT_R10G10B10A2_TYPELESS = 23
// @ts-ignore
const DXGI_FORMAT_R10G10B10A2_UNORM = 24
// @ts-ignore
const DXGI_FORMAT_R10G10B10A2_UINT = 25
// @ts-ignore
const DXGI_FORMAT_R11G11B10_FLOAT = 26
// @ts-ignore
const DXGI_FORMAT_R8G8B8A8_TYPELESS = 27
// @ts-ignore
const DXGI_FORMAT_R8G8B8A8_UNORM = 28
// @ts-ignore
const DXGI_FORMAT_R8G8B8A8_UNORM_SRGB = 29
// @ts-ignore
const DXGI_FORMAT_R8G8B8A8_UINT = 30
// @ts-ignore
const DXGI_FORMAT_R8G8B8A8_SNORM = 31
// @ts-ignore
const DXGI_FORMAT_R8G8B8A8_SINT = 32
// @ts-ignore
const DXGI_FORMAT_R16G16_TYPELESS = 33
// @ts-ignore
const DXGI_FORMAT_R16G16_FLOAT = 34
// @ts-ignore
const DXGI_FORMAT_R16G16_UNORM = 35
// @ts-ignore
const DXGI_FORMAT_R16G16_UINT = 36
// @ts-ignore
const DXGI_FORMAT_R16G16_SNORM = 37
// @ts-ignore
const DXGI_FORMAT_R16G16_SINT = 38
// @ts-ignore
const DXGI_FORMAT_R32_TYPELESS = 39
// @ts-ignore
const DXGI_FORMAT_D32_FLOAT = 40
// @ts-ignore
const DXGI_FORMAT_R32_FLOAT = 41
// @ts-ignore
const DXGI_FORMAT_R32_UINT = 42
// @ts-ignore
const DXGI_FORMAT_R32_SINT = 43
// @ts-ignore
const DXGI_FORMAT_R24G8_TYPELESS = 44
// @ts-ignore
const DXGI_FORMAT_D24_UNORM_S8_UINT = 45
// @ts-ignore
const DXGI_FORMAT_R24_UNORM_X8_TYPELESS = 46
// @ts-ignore
const DXGI_FORMAT_X24_TYPELESS_G8_UINT = 47
// @ts-ignore
const DXGI_FORMAT_R8G8_TYPELESS = 48
// @ts-ignore
const DXGI_FORMAT_R8G8_UNORM = 49
// @ts-ignore
const DXGI_FORMAT_R8G8_UINT = 50
// @ts-ignore
const DXGI_FORMAT_R8G8_SNORM = 51
// @ts-ignore
const DXGI_FORMAT_R8G8_SINT = 52
// @ts-ignore
const DXGI_FORMAT_R16_TYPELESS = 53
// @ts-ignore
const DXGI_FORMAT_R16_FLOAT = 54
// @ts-ignore
const DXGI_FORMAT_D16_UNORM = 55
// @ts-ignore
const DXGI_FORMAT_R16_UNORM = 56
// @ts-ignore
const DXGI_FORMAT_R16_UINT = 57
// @ts-ignore
const DXGI_FORMAT_R16_SNORM = 58
// @ts-ignore
const DXGI_FORMAT_R16_SINT = 59
// @ts-ignore
const DXGI_FORMAT_R8_TYPELESS = 60
// @ts-ignore
const DXGI_FORMAT_R8_UNORM = 61
// @ts-ignore
const DXGI_FORMAT_R8_UINT = 62
// @ts-ignore
const DXGI_FORMAT_R8_SNORM = 63
// @ts-ignore
const DXGI_FORMAT_R8_SINT = 64
// @ts-ignore
const DXGI_FORMAT_A8_UNORM = 65
// @ts-ignore
const DXGI_FORMAT_R1_UNORM = 66
// @ts-ignore
const DXGI_FORMAT_R9G9B9E5_SHAREDEXP = 67
// @ts-ignore
const DXGI_FORMAT_R8G8_B8G8_UNORM = 68
// @ts-ignore
const DXGI_FORMAT_G8R8_G8B8_UNORM = 69
// @ts-ignore
const DXGI_FORMAT_BC1_TYPELESS = 70
// @ts-ignore
const DXGI_FORMAT_BC1_UNORM = 71
// @ts-ignore
const DXGI_FORMAT_BC1_UNORM_SRGB = 72
// @ts-ignore
const DXGI_FORMAT_BC2_TYPELESS = 73
// @ts-ignore
const DXGI_FORMAT_BC2_UNORM = 74
// @ts-ignore
const DXGI_FORMAT_BC2_UNORM_SRGB = 75
// @ts-ignore
const DXGI_FORMAT_BC3_TYPELESS = 76
// @ts-ignore
const DXGI_FORMAT_BC3_UNORM = 77
// @ts-ignore
const DXGI_FORMAT_BC3_UNORM_SRGB = 78
// @ts-ignore
const DXGI_FORMAT_BC4_TYPELESS = 79
// @ts-ignore
const DXGI_FORMAT_BC4_UNORM = 80
// @ts-ignore
const DXGI_FORMAT_BC4_SNORM = 81
// @ts-ignore
const DXGI_FORMAT_BC5_TYPELESS = 82
// @ts-ignore
const DXGI_FORMAT_BC5_UNORM = 83
// @ts-ignore
const DXGI_FORMAT_BC5_SNORM = 84
// @ts-ignore
const DXGI_FORMAT_B5G6R5_UNORM = 85
// @ts-ignore
const DXGI_FORMAT_B5G5R5A1_UNORM = 86
// @ts-ignore
const DXGI_FORMAT_B8G8R8A8_UNORM = 87
// @ts-ignore
const DXGI_FORMAT_B8G8R8X8_UNORM = 88
// @ts-ignore
const DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM = 89
// @ts-ignore
const DXGI_FORMAT_B8G8R8A8_TYPELESS = 90
// @ts-ignore
const DXGI_FORMAT_B8G8R8A8_UNORM_SRGB = 91
// @ts-ignore
const DXGI_FORMAT_B8G8R8X8_TYPELESS = 92
// @ts-ignore
const DXGI_FORMAT_B8G8R8X8_UNORM_SRGB = 93
// @ts-ignore
const DXGI_FORMAT_BC6H_TYPELESS = 94
// @ts-ignore
const DXGI_FORMAT_BC6H_UF16 = 95
// @ts-ignore
const DXGI_FORMAT_BC6H_SF16 = 96
// @ts-ignore
const DXGI_FORMAT_BC7_TYPELESS = 97
// @ts-ignore
const DXGI_FORMAT_BC7_UNORM = 98
// @ts-ignore
const DXGI_FORMAT_BC7_UNORM_SRGB = 99
// @ts-ignore
const DXGI_FORMAT_AYUV = 100
// @ts-ignore
const DXGI_FORMAT_Y410 = 101
// @ts-ignore
const DXGI_FORMAT_Y416 = 102
// @ts-ignore
const DXGI_FORMAT_NV12 = 103
// @ts-ignore
const DXGI_FORMAT_P010 = 104
// @ts-ignore
const DXGI_FORMAT_P016 = 105
// @ts-ignore
const DXGI_FORMAT_420_OPAQUE = 106
// @ts-ignore
const DXGI_FORMAT_YUY2 = 107
// @ts-ignore
const DXGI_FORMAT_Y210 = 108
// @ts-ignore
const DXGI_FORMAT_Y216 = 109
// @ts-ignore
const DXGI_FORMAT_NV11 = 110
// @ts-ignore
const DXGI_FORMAT_AI44 = 111
// @ts-ignore
const DXGI_FORMAT_IA44 = 112
// @ts-ignore
const DXGI_FORMAT_P8 = 113
// @ts-ignore
const DXGI_FORMAT_A8P8 = 114
// @ts-ignore
const DXGI_FORMAT_B4G4R4A4_UNORM = 115
// @ts-ignore
const DXGI_FORMAT_P208 = 130
// @ts-ignore
const DXGI_FORMAT_V208 = 131
// @ts-ignore
const DXGI_FORMAT_V408 = 132
// @ts-ignore
const DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE = 189
// @ts-ignore
const DXGI_FORMAT_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE = 190
// @ts-ignore
const DXGI_FORMAT_FORCE_UINT = 0xffffffff

const mapFromDXGI = {
  // 8-bit formats
  [DXGI_FORMAT_R8_UNORM]: 'R8_UNORM',
  [DXGI_FORMAT_R8_SNORM]: 'R8_SNORM',
  [DXGI_FORMAT_R8_UINT]: 'R8_UINT',
  [DXGI_FORMAT_R8_SINT]: 'R8_SINT',
  [DXGI_FORMAT_A8_UNORM]: 'R8_UNORM',
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

// @ts-ignore
const VK_FORMAT_R4G4_UNORM_PACK8 = 1
// @ts-ignore
const VK_FORMAT_R4G4B4A4_UNORM_PACK16 = 2
// @ts-ignore
const VK_FORMAT_B4G4R4A4_UNORM_PACK16 = 3
// @ts-ignore
const VK_FORMAT_R5G6B5_UNORM_PACK16 = 4
// @ts-ignore
const VK_FORMAT_B5G6R5_UNORM_PACK16 = 5
// @ts-ignore
const VK_FORMAT_R5G5B5A1_UNORM_PACK16 = 6
// @ts-ignore
const VK_FORMAT_B5G5R5A1_UNORM_PACK16 = 7
// @ts-ignore
const VK_FORMAT_A1R5G5B5_UNORM_PACK16 = 8
// @ts-ignore
const VK_FORMAT_R8_UNORM = 9
// @ts-ignore
const VK_FORMAT_R8_SNORM = 10
// @ts-ignore
const VK_FORMAT_R8_USCALED = 11
// @ts-ignore
const VK_FORMAT_R8_SSCALED = 12
// @ts-ignore
const VK_FORMAT_R8_UINT = 13
// @ts-ignore
const VK_FORMAT_R8_SINT = 14
// @ts-ignore
const VK_FORMAT_R8_SRGB = 15
// @ts-ignore
const VK_FORMAT_R8G8_UNORM = 16
// @ts-ignore
const VK_FORMAT_R8G8_SNORM = 17
// @ts-ignore
const VK_FORMAT_R8G8_USCALED = 18
// @ts-ignore
const VK_FORMAT_R8G8_SSCALED = 19
// @ts-ignore
const VK_FORMAT_R8G8_UINT = 20
// @ts-ignore
const VK_FORMAT_R8G8_SINT = 21
// @ts-ignore
const VK_FORMAT_R8G8_SRGB = 22
// @ts-ignore
const VK_FORMAT_R8G8B8_UNORM = 23
// @ts-ignore
const VK_FORMAT_R8G8B8_SNORM = 24
// @ts-ignore
const VK_FORMAT_R8G8B8_USCALED = 25
// @ts-ignore
const VK_FORMAT_R8G8B8_SSCALED = 26
// @ts-ignore
const VK_FORMAT_R8G8B8_UINT = 27
// @ts-ignore
const VK_FORMAT_R8G8B8_SINT = 28
// @ts-ignore
const VK_FORMAT_R8G8B8_SRGB = 29
// @ts-ignore
const VK_FORMAT_B8G8R8_UNORM = 30
// @ts-ignore
const VK_FORMAT_B8G8R8_SNORM = 31
// @ts-ignore
const VK_FORMAT_B8G8R8_USCALED = 32
// @ts-ignore
const VK_FORMAT_B8G8R8_SSCALED = 33
// @ts-ignore
const VK_FORMAT_B8G8R8_UINT = 34
// @ts-ignore
const VK_FORMAT_B8G8R8_SINT = 35
// @ts-ignore
const VK_FORMAT_B8G8R8_SRGB = 36
// @ts-ignore
const VK_FORMAT_R8G8B8A8_UNORM = 37
// @ts-ignore
const VK_FORMAT_R8G8B8A8_SNORM = 38
// @ts-ignore
const VK_FORMAT_R8G8B8A8_USCALED = 39
// @ts-ignore
const VK_FORMAT_R8G8B8A8_SSCALED = 40
// @ts-ignore
const VK_FORMAT_R8G8B8A8_UINT = 41
// @ts-ignore
const VK_FORMAT_R8G8B8A8_SINT = 42
// @ts-ignore
const VK_FORMAT_R8G8B8A8_SRGB = 43
// @ts-ignore
const VK_FORMAT_B8G8R8A8_UNORM = 44
// @ts-ignore
const VK_FORMAT_B8G8R8A8_SNORM = 45
// @ts-ignore
const VK_FORMAT_B8G8R8A8_USCALED = 46
// @ts-ignore
const VK_FORMAT_B8G8R8A8_SSCALED = 47
// @ts-ignore
const VK_FORMAT_B8G8R8A8_UINT = 48
// @ts-ignore
const VK_FORMAT_B8G8R8A8_SINT = 49
// @ts-ignore
const VK_FORMAT_B8G8R8A8_SRGB = 50
// @ts-ignore
const VK_FORMAT_A8B8G8R8_UNORM_PACK32 = 51
// @ts-ignore
const VK_FORMAT_A8B8G8R8_SNORM_PACK32 = 52
// @ts-ignore
const VK_FORMAT_A8B8G8R8_USCALED_PACK32 = 53
// @ts-ignore
const VK_FORMAT_A8B8G8R8_SSCALED_PACK32 = 54
// @ts-ignore
const VK_FORMAT_A8B8G8R8_UINT_PACK32 = 55
// @ts-ignore
const VK_FORMAT_A8B8G8R8_SINT_PACK32 = 56
// @ts-ignore
const VK_FORMAT_A8B8G8R8_SRGB_PACK32 = 57
// @ts-ignore
const VK_FORMAT_A2R10G10B10_UNORM_PACK32 = 58
// @ts-ignore
const VK_FORMAT_A2R10G10B10_SNORM_PACK32 = 59
// @ts-ignore
const VK_FORMAT_A2R10G10B10_USCALED_PACK32 = 60
// @ts-ignore
const VK_FORMAT_A2R10G10B10_SSCALED_PACK32 = 61
// @ts-ignore
const VK_FORMAT_A2R10G10B10_UINT_PACK32 = 62
// @ts-ignore
const VK_FORMAT_A2R10G10B10_SINT_PACK32 = 63
// @ts-ignore
const VK_FORMAT_A2B10G10R10_UNORM_PACK32 = 64
// @ts-ignore
const VK_FORMAT_A2B10G10R10_SNORM_PACK32 = 65
// @ts-ignore
const VK_FORMAT_A2B10G10R10_USCALED_PACK32 = 66
// @ts-ignore
const VK_FORMAT_A2B10G10R10_SSCALED_PACK32 = 67
// @ts-ignore
const VK_FORMAT_A2B10G10R10_UINT_PACK32 = 68
// @ts-ignore
const VK_FORMAT_A2B10G10R10_SINT_PACK32 = 69
// @ts-ignore
const VK_FORMAT_R16_UNORM = 70
// @ts-ignore
const VK_FORMAT_R16_SNORM = 71
// @ts-ignore
const VK_FORMAT_R16_USCALED = 72
// @ts-ignore
const VK_FORMAT_R16_SSCALED = 73
// @ts-ignore
const VK_FORMAT_R16_UINT = 74
// @ts-ignore
const VK_FORMAT_R16_SINT = 75
// @ts-ignore
const VK_FORMAT_R16_SFLOAT = 76
// @ts-ignore
const VK_FORMAT_R16G16_UNORM = 77
// @ts-ignore
const VK_FORMAT_R16G16_SNORM = 78
// @ts-ignore
const VK_FORMAT_R16G16_USCALED = 79
// @ts-ignore
const VK_FORMAT_R16G16_SSCALED = 80
// @ts-ignore
const VK_FORMAT_R16G16_UINT = 81
// @ts-ignore
const VK_FORMAT_R16G16_SINT = 82
// @ts-ignore
const VK_FORMAT_R16G16_SFLOAT = 83
// @ts-ignore
const VK_FORMAT_R16G16B16_UNORM = 84
// @ts-ignore
const VK_FORMAT_R16G16B16_SNORM = 85
// @ts-ignore
const VK_FORMAT_R16G16B16_USCALED = 86
// @ts-ignore
const VK_FORMAT_R16G16B16_SSCALED = 87
// @ts-ignore
const VK_FORMAT_R16G16B16_UINT = 88
// @ts-ignore
const VK_FORMAT_R16G16B16_SINT = 89
// @ts-ignore
const VK_FORMAT_R16G16B16_SFLOAT = 90
// @ts-ignore
const VK_FORMAT_R16G16B16A16_UNORM = 91
// @ts-ignore
const VK_FORMAT_R16G16B16A16_SNORM = 92
// @ts-ignore
const VK_FORMAT_R16G16B16A16_USCALED = 93
// @ts-ignore
const VK_FORMAT_R16G16B16A16_SSCALED = 94
// @ts-ignore
const VK_FORMAT_R16G16B16A16_UINT = 95
// @ts-ignore
const VK_FORMAT_R16G16B16A16_SINT = 96
// @ts-ignore
const VK_FORMAT_R16G16B16A16_SFLOAT = 97
// @ts-ignore
const VK_FORMAT_R32_UINT = 98
// @ts-ignore
const VK_FORMAT_R32_SINT = 99
// @ts-ignore
const VK_FORMAT_R32_SFLOAT = 100
// @ts-ignore
const VK_FORMAT_R32G32_UINT = 101
// @ts-ignore
const VK_FORMAT_R32G32_SINT = 102
// @ts-ignore
const VK_FORMAT_R32G32_SFLOAT = 103
// @ts-ignore
const VK_FORMAT_R32G32B32_UINT = 104
// @ts-ignore
const VK_FORMAT_R32G32B32_SINT = 105
// @ts-ignore
const VK_FORMAT_R32G32B32_SFLOAT = 106
// @ts-ignore
const VK_FORMAT_R32G32B32A32_UINT = 107
// @ts-ignore
const VK_FORMAT_R32G32B32A32_SINT = 108
// @ts-ignore
const VK_FORMAT_R32G32B32A32_SFLOAT = 109
// @ts-ignore
const VK_FORMAT_R64_UINT = 110
// @ts-ignore
const VK_FORMAT_R64_SINT = 111
// @ts-ignore
const VK_FORMAT_R64_SFLOAT = 112
// @ts-ignore
const VK_FORMAT_R64G64_UINT = 113
// @ts-ignore
const VK_FORMAT_R64G64_SINT = 114
// @ts-ignore
const VK_FORMAT_R64G64_SFLOAT = 115
// @ts-ignore
const VK_FORMAT_R64G64B64_UINT = 116
// @ts-ignore
const VK_FORMAT_R64G64B64_SINT = 117
// @ts-ignore
const VK_FORMAT_R64G64B64_SFLOAT = 118
// @ts-ignore
const VK_FORMAT_R64G64B64A64_UINT = 119
// @ts-ignore
const VK_FORMAT_R64G64B64A64_SINT = 120
// @ts-ignore
const VK_FORMAT_R64G64B64A64_SFLOAT = 121
// @ts-ignore
const VK_FORMAT_B10G11R11_UFLOAT_PACK32 = 122
// @ts-ignore
const VK_FORMAT_E5B9G9R9_UFLOAT_PACK32 = 123
// @ts-ignore
const VK_FORMAT_D16_UNORM = 124
// @ts-ignore
const VK_FORMAT_X8_D24_UNORM_PACK32 = 125
// @ts-ignore
const VK_FORMAT_D32_SFLOAT = 126
// @ts-ignore
const VK_FORMAT_S8_UINT = 127
// @ts-ignore
const VK_FORMAT_D16_UNORM_S8_UINT = 128
// @ts-ignore
const VK_FORMAT_D24_UNORM_S8_UINT = 129
// @ts-ignore
const VK_FORMAT_D32_SFLOAT_S8_UINT = 130
// @ts-ignore
const VK_FORMAT_BC1_RGB_UNORM_BLOCK = 131
// @ts-ignore
const VK_FORMAT_BC1_RGB_SRGB_BLOCK = 132
// @ts-ignore
const VK_FORMAT_BC1_RGBA_UNORM_BLOCK = 133
// @ts-ignore
const VK_FORMAT_BC1_RGBA_SRGB_BLOCK = 134
// @ts-ignore
const VK_FORMAT_BC2_UNORM_BLOCK = 135
// @ts-ignore
const VK_FORMAT_BC2_SRGB_BLOCK = 136
// @ts-ignore
const VK_FORMAT_BC3_UNORM_BLOCK = 137
// @ts-ignore
const VK_FORMAT_BC3_SRGB_BLOCK = 138
// @ts-ignore
const VK_FORMAT_BC4_UNORM_BLOCK = 139
// @ts-ignore
const VK_FORMAT_BC4_SNORM_BLOCK = 140
// @ts-ignore
const VK_FORMAT_BC5_UNORM_BLOCK = 141
// @ts-ignore
const VK_FORMAT_BC5_SNORM_BLOCK = 142
// @ts-ignore
const VK_FORMAT_BC6H_UFLOAT_BLOCK = 143
// @ts-ignore
const VK_FORMAT_BC6H_SFLOAT_BLOCK = 144
// @ts-ignore
const VK_FORMAT_BC7_UNORM_BLOCK = 145
// @ts-ignore
const VK_FORMAT_BC7_SRGB_BLOCK = 146
// @ts-ignore
const VK_FORMAT_ETC2_R8G8B8_UNORM_BLOCK = 147
// @ts-ignore
const VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK = 148
// @ts-ignore
const VK_FORMAT_ETC2_R8G8B8A1_UNORM_BLOCK = 149
// @ts-ignore
const VK_FORMAT_ETC2_R8G8B8A1_SRGB_BLOCK = 150
// @ts-ignore
const VK_FORMAT_ETC2_R8G8B8A8_UNORM_BLOCK = 151
// @ts-ignore
const VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK = 152
// @ts-ignore
const VK_FORMAT_EAC_R11_UNORM_BLOCK = 153
// @ts-ignore
const VK_FORMAT_EAC_R11_SNORM_BLOCK = 154
// @ts-ignore
const VK_FORMAT_EAC_R11G11_UNORM_BLOCK = 155
// @ts-ignore
const VK_FORMAT_EAC_R11G11_SNORM_BLOCK = 156
// @ts-ignore
const VK_FORMAT_ASTC_4x4_UNORM_BLOCK = 157
// @ts-ignore
const VK_FORMAT_ASTC_4x4_SRGB_BLOCK = 158
// @ts-ignore
const VK_FORMAT_ASTC_5x4_UNORM_BLOCK = 159
// @ts-ignore
const VK_FORMAT_ASTC_5x4_SRGB_BLOCK = 160
// @ts-ignore
const VK_FORMAT_ASTC_5x5_UNORM_BLOCK = 161
// @ts-ignore
const VK_FORMAT_ASTC_5x5_SRGB_BLOCK = 162
// @ts-ignore
const VK_FORMAT_ASTC_6x5_UNORM_BLOCK = 163
// @ts-ignore
const VK_FORMAT_ASTC_6x5_SRGB_BLOCK = 164
// @ts-ignore
const VK_FORMAT_ASTC_6x6_UNORM_BLOCK = 165
// @ts-ignore
const VK_FORMAT_ASTC_6x6_SRGB_BLOCK = 166
// @ts-ignore
const VK_FORMAT_ASTC_8x5_UNORM_BLOCK = 167
// @ts-ignore
const VK_FORMAT_ASTC_8x5_SRGB_BLOCK = 168
// @ts-ignore
const VK_FORMAT_ASTC_8x6_UNORM_BLOCK = 169
// @ts-ignore
const VK_FORMAT_ASTC_8x6_SRGB_BLOCK = 170
// @ts-ignore
const VK_FORMAT_ASTC_8x8_UNORM_BLOCK = 171
// @ts-ignore
const VK_FORMAT_ASTC_8x8_SRGB_BLOCK = 172
// @ts-ignore
const VK_FORMAT_ASTC_10x5_UNORM_BLOCK = 173
// @ts-ignore
const VK_FORMAT_ASTC_10x5_SRGB_BLOCK = 174
// @ts-ignore
const VK_FORMAT_ASTC_10x6_UNORM_BLOCK = 175
// @ts-ignore
const VK_FORMAT_ASTC_10x6_SRGB_BLOCK = 176
// @ts-ignore
const VK_FORMAT_ASTC_10x8_UNORM_BLOCK = 177
// @ts-ignore
const VK_FORMAT_ASTC_10x8_SRGB_BLOCK = 178
// @ts-ignore
const VK_FORMAT_ASTC_10x10_UNORM_BLOCK = 179
// @ts-ignore
const VK_FORMAT_ASTC_10x10_SRGB_BLOCK = 180
// @ts-ignore
const VK_FORMAT_ASTC_12x10_UNORM_BLOCK = 181
// @ts-ignore
const VK_FORMAT_ASTC_12x10_SRGB_BLOCK = 182
// @ts-ignore
const VK_FORMAT_ASTC_12x12_UNORM_BLOCK = 183
// @ts-ignore
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

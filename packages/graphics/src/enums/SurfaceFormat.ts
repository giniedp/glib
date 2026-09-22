import { type DataType, dataTypeToWebGL } from './DataType'
import { GLConst as gl } from './GLConst'
export type TextureCompression = 'astc' | 'etc1' | 'etc2' | 'pvrtc' | 'bptc' | 'bc'

export type SurfaceFormat = GPUTextureFormat
export type DepthStencilFormat = Extract<
  SurfaceFormat,
  'stencil8' | 'depth16unorm' | 'depth24plus' | 'depth24plus-stencil8' | 'depth32float' | 'depth32float-stencil8'
>

export function surfaceIsDepthStencilFormat(format: SurfaceFormat): format is DepthStencilFormat {
  return surfaceIsDepthFormat(format) || surfaceIsStencilFormat(format)
}

export function surfaceIsDepthFormat(format: SurfaceFormat): boolean {
  switch (format) {
    case 'depth16unorm':
    case 'depth24plus':
    case 'depth24plus-stencil8':
    case 'depth32float':
    case 'depth32float-stencil8':
      return true
    default:
      return false
  }
}

export function surfaceIsStencilFormat(format: SurfaceFormat): boolean {
  switch (format) {
    case 'stencil8':
    case 'depth24plus-stencil8':
    case 'depth32float-stencil8':
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
  r8unorm: formatInfo(1, 'uint8', 1),
  r8snorm: formatInfo(1, 'uint8', 1),
  r8uint: formatInfo(1, 'uint8', 1),
  r8sint: formatInfo(1, 'uint8', 1),
  // 16-bit formats
  r16unorm: formatInfo(2, 'uint16', 1),
  r16snorm: formatInfo(2, 'uint16', 1),
  r16uint: formatInfo(2, 'uint16', 1),
  r16sint: formatInfo(2, 'uint16', 1),
  r16float: formatInfo(2, 'float16', 1),
  rg8unorm: formatInfo(2, 'uint8', 2),
  rg8snorm: formatInfo(2, 'uint8', 2),
  rg8uint: formatInfo(2, 'uint8', 2),
  rg8sint: formatInfo(2, 'uint8', 2),
  // 32-bit formats
  r32uint: formatInfo(4, 'uint32', 1),
  r32sint: formatInfo(4, 'uint32', 1),
  r32float: formatInfo(4, 'float32', 1),
  rg16unorm: formatInfo(4, 'uint16', 2),
  rg16snorm: formatInfo(4, 'uint16', 2),
  rg16uint: formatInfo(4, 'uint16', 2),
  rg16sint: formatInfo(4, 'uint16', 2),
  rg16float: formatInfo(4, 'float16', 2),
  rgba8unorm: formatInfo(4, 'uint8', 4),
  'rgba8unorm-srgb': formatInfo(4, 'uint8', 4, true),
  rgba8snorm: formatInfo(4, 'uint8', 4),
  rgba8uint: formatInfo(4, 'uint8', 4),
  rgba8sint: formatInfo(4, 'uint8', 4),
  bgra8unorm: formatInfo(4, 'uint8', 4),
  'bgra8unorm-srgb': formatInfo(4, 'uint8', 4, true),
  // Packed 32-bit formats
  rgb9e5ufloat: formatInfo(4, null, 3),
  rgb10a2uint: formatInfo(4, null, 4),
  rgb10a2unorm: formatInfo(4, null, 4),
  rg11b10ufloat: formatInfo(4, null, 3),
  // 64-bit formats
  rg32uint: formatInfo(8, 'uint32', 2),
  rg32sint: formatInfo(8, 'uint32', 2),
  rg32float: formatInfo(8, 'float32', 2),
  rgba16unorm: formatInfo(8, 'uint16', 4),
  rgba16snorm: formatInfo(8, 'uint16', 4),
  rgba16uint: formatInfo(8, 'uint16', 4),
  rgba16sint: formatInfo(8, 'uint16', 4),
  rgba16float: formatInfo(8, 'float16', 4),
  // 128-bit formats
  rgba32uint: formatInfo(16, 'uint32', 4),
  rgba32sint: formatInfo(16, 'uint32', 4),
  rgba32float: formatInfo(16, 'float32', 4),
  // Depth/stencil formats
  stencil8: formatInfo(1, null, 1),
  depth16unorm: formatInfo(2, null, 1),
  depth24plus: formatInfo(4, null, 1),
  'depth24plus-stencil8': formatInfo(4, null, 2),
  depth32float: formatInfo(4, null, 1),
  'depth32float-stencil8': formatInfo(8, null, 2),
  // BC
  'bc1-rgba-unorm': compressedInfo('bc', 4, block.bc1),
  'bc2-rgba-unorm': compressedInfo('bc', 4, block.bc2),
  'bc3-rgba-unorm': compressedInfo('bc', 4, block.bc3),
  'bc1-rgba-unorm-srgb': compressedInfo('bc', 4, block.bc1, true),
  'bc2-rgba-unorm-srgb': compressedInfo('bc', 4, block.bc2, true),
  'bc3-rgba-unorm-srgb': compressedInfo('bc', 4, block.bc3, true),
  'bc4-r-unorm': compressedInfo('bc', 1, block.bc4),
  'bc4-r-snorm': compressedInfo('bc', 1, block.bc4),
  'bc5-rg-unorm': compressedInfo('bc', 2, block.bc5),
  'bc5-rg-snorm': compressedInfo('bc', 2, block.bc5),
  'bc6h-rgb-ufloat': compressedInfo('bc', 3, block.bc6h),
  'bc6h-rgb-float': compressedInfo('bc', 3, block.bc6h),
  'bc7-rgba-unorm': compressedInfo('bc', 4, block.bc7),
  'bc7-rgba-unorm-srgb': compressedInfo('bc', 4, block.bc7, true),
  // ETC2
  'eac-r11unorm': compressedInfo('etc2', 1, [4, 4, 8]),
  'eac-r11snorm': compressedInfo('etc2', 1, [4, 4, 8]),
  'eac-rg11unorm': compressedInfo('etc2', 2, [4, 4, 16]),
  'eac-rg11snorm': compressedInfo('etc2', 2, [4, 4, 16]),
  'etc2-rgb8unorm': compressedInfo('etc2', 3, [4, 4, 8]),
  'etc2-rgb8a1unorm': compressedInfo('etc2', 4, [4, 4, 8]),
  'etc2-rgba8unorm': compressedInfo('etc2', 4, [4, 4, 16]),
  'etc2-rgb8unorm-srgb': compressedInfo('etc2', 3, [4, 4, 8], true),
  'etc2-rgb8a1unorm-srgb': compressedInfo('etc2', 4, [4, 4, 8], true),
  'etc2-rgba8unorm-srgb': compressedInfo('etc2', 4, [4, 4, 16], true),
  // ASTC
  'astc-4x4-unorm': compressedInfo('astc', 4, block.astc4x4),
  'astc-5x4-unorm': compressedInfo('astc', 4, block.astc5x4),
  'astc-5x5-unorm': compressedInfo('astc', 4, block.astc5x5),
  'astc-6x5-unorm': compressedInfo('astc', 4, block.astc6x5),
  'astc-6x6-unorm': compressedInfo('astc', 4, block.astc6x6),
  'astc-8x5-unorm': compressedInfo('astc', 4, block.astc8x5),
  'astc-8x6-unorm': compressedInfo('astc', 4, block.astc8x6),
  'astc-8x8-unorm': compressedInfo('astc', 4, block.astc8x8),
  'astc-10x5-unorm': compressedInfo('astc', 4, block.astc10x5),
  'astc-10x6-unorm': compressedInfo('astc', 4, block.astc10x6),
  'astc-10x8-unorm': compressedInfo('astc', 4, block.astc10x8),
  'astc-10x10-unorm': compressedInfo('astc', 4, block.astc10x10),
  'astc-12x10-unorm': compressedInfo('astc', 4, block.astc12x10),
  'astc-12x12-unorm': compressedInfo('astc', 4, block.astc12x12),

  'astc-4x4-unorm-srgb': compressedInfo('astc', 4, block.astc4x4, true),
  'astc-5x4-unorm-srgb': compressedInfo('astc', 4, block.astc5x4, true),
  'astc-5x5-unorm-srgb': compressedInfo('astc', 4, block.astc5x5, true),
  'astc-6x5-unorm-srgb': compressedInfo('astc', 4, block.astc6x5, true),
  'astc-6x6-unorm-srgb': compressedInfo('astc', 4, block.astc6x6, true),
  'astc-8x5-unorm-srgb': compressedInfo('astc', 4, block.astc8x5, true),
  'astc-8x6-unorm-srgb': compressedInfo('astc', 4, block.astc8x6, true),
  'astc-8x8-unorm-srgb': compressedInfo('astc', 4, block.astc8x8, true),
  'astc-10x5-unorm-srgb': compressedInfo('astc', 4, block.astc10x5, true),
  'astc-10x6-unorm-srgb': compressedInfo('astc', 4, block.astc10x6, true),
  'astc-10x8-unorm-srgb': compressedInfo('astc', 4, block.astc10x8, true),
  'astc-10x10-unorm-srgb': compressedInfo('astc', 4, block.astc10x10, true),
  'astc-12x10-unorm-srgb': compressedInfo('astc', 4, block.astc12x10, true),
  'astc-12x12-unorm-srgb': compressedInfo('astc', 4, block.astc12x12, true),
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

export function surfaceFormatIsLinear(format: SurfaceFormat): boolean {
  return !surfaceFormatInfo(format)?.srgb
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
  r8unorm: gl.R8,
  r8snorm: gl.R8_SNORM,
  r8uint: gl.R8UI,
  r8sint: gl.R8I,
  // 16-bit formats
  r16unorm: EXT_texture_norm16.R16_EXT,
  r16snorm: EXT_texture_norm16.R16_SNORM_EXT,
  r16uint: gl.R16UI,
  r16sint: gl.R16I,
  r16float: gl.R16F,
  rg8unorm: gl.RG8,
  rg8snorm: gl.RG8_SNORM,
  rg8uint: gl.RG8UI,
  rg8sint: gl.RG8I,
  // 32-bit formats
  r32uint: gl.R32UI,
  r32sint: gl.R32I,
  r32float: gl.R32F,
  rg16unorm: EXT_texture_norm16.RG16_EXT,
  rg16snorm: EXT_texture_norm16.RG16_SNORM_EXT,
  rg16uint: gl.RG16UI,
  rg16sint: gl.RG16I,
  rg16float: gl.RG16F,
  rgba8unorm: gl.RGBA8,
  'rgba8unorm-srgb': gl.SRGB8_ALPHA8,
  rgba8snorm: gl.RGBA8_SNORM,
  rgba8uint: gl.RGBA8UI,
  rgba8sint: gl.RGBA8I,
  bgra8unorm: EXT_texture_format_BGRA8888.BGRA_EXT,
  'bgra8unorm-srgb': gl.SRGB8_ALPHA8,
  // Packed 32-bit formats
  rgb9e5ufloat: gl.RGB9_E5,
  rgb10a2uint: gl.RGB10_A2UI,
  rgb10a2unorm: gl.RGB10_A2,
  rg11b10ufloat: gl.R11F_G11F_B10F,
  // 64-bit formats
  rg32uint: gl.RG32UI,
  rg32sint: gl.RG32I,
  rg32float: gl.RG32F,
  rgba16unorm: EXT_texture_norm16.RGBA16_EXT,
  rgba16snorm: EXT_texture_norm16.RGBA16_SNORM_EXT,
  rgba16uint: gl.RGBA16UI,
  rgba16sint: gl.RGBA16I,
  rgba16float: gl.RGBA16F,
  // 128-bit formats
  rgba32uint: gl.RGBA32UI,
  rgba32sint: gl.RGBA32I,
  rgba32float: gl.RGBA32F,
  // Depth/stencil formats
  stencil8: gl.STENCIL_INDEX8,
  depth16unorm: gl.DEPTH_COMPONENT16,
  depth24plus: gl.DEPTH_COMPONENT24,
  'depth24plus-stencil8': gl.DEPTH24_STENCIL8,
  depth32float: gl.DEPTH_COMPONENT32F,
  'depth32float-stencil8': gl.DEPTH32F_STENCIL8,
  // BC
  'bc1-rgba-unorm': WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
  'bc2-rgba-unorm': WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
  'bc3-rgba-unorm': WEBGL_compressed_texture_s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT,
  'bc1-rgba-unorm-srgb': WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
  'bc2-rgba-unorm-srgb': WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
  'bc3-rgba-unorm-srgb': WEBGL_compressed_texture_s3tc_srgb.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,
  'bc4-r-unorm': EXT_texture_compression_rgtc.COMPRESSED_RED_RGTC1_EXT,
  'bc4-r-snorm': EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
  'bc5-rg-unorm': EXT_texture_compression_rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
  'bc5-rg-snorm': EXT_texture_compression_rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,
  'bc6h-rgb-ufloat': EXT_texture_compression_bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
  'bc6h-rgb-float': EXT_texture_compression_bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
  'bc7-rgba-unorm': EXT_texture_compression_bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
  'bc7-rgba-unorm-srgb': EXT_texture_compression_bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT,
  // ETC2
  'eac-r11unorm': WEBGL_compressed_texture_etc.COMPRESSED_R11_EAC,
  'eac-r11snorm': WEBGL_compressed_texture_etc.COMPRESSED_SIGNED_R11_EAC,
  'eac-rg11unorm': WEBGL_compressed_texture_etc.COMPRESSED_RG11_EAC,
  'eac-rg11snorm': WEBGL_compressed_texture_etc.COMPRESSED_SIGNED_RG11_EAC,
  'etc2-rgb8unorm': WEBGL_compressed_texture_etc.COMPRESSED_RGB8_ETC2,
  'etc2-rgb8unorm-srgb': WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_ETC2,
  'etc2-rgb8a1unorm': WEBGL_compressed_texture_etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  'etc2-rgb8a1unorm-srgb': WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  'etc2-rgba8unorm': WEBGL_compressed_texture_etc.COMPRESSED_RGBA8_ETC2_EAC,
  'etc2-rgba8unorm-srgb': WEBGL_compressed_texture_etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
  // ASTC
  'astc-4x4-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_4x4_KHR,
  'astc-4x4-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
  'astc-5x4-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_5x4_KHR,
  'astc-5x4-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
  'astc-5x5-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_5x5_KHR,
  'astc-5x5-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
  'astc-6x5-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_6x5_KHR,
  'astc-6x5-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
  'astc-6x6-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_6x6_KHR,
  'astc-6x6-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
  'astc-8x5-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x5_KHR,
  'astc-8x5-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
  'astc-8x6-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x6_KHR,
  'astc-8x6-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
  'astc-8x8-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_8x8_KHR,
  'astc-8x8-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
  'astc-10x5-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x5_KHR,
  'astc-10x5-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
  'astc-10x6-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x6_KHR,
  'astc-10x6-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
  'astc-10x8-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x8_KHR,
  'astc-10x8-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
  'astc-10x10-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_10x10_KHR,
  'astc-10x10-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
  'astc-12x10-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_12x10_KHR,
  'astc-12x10-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
  'astc-12x12-unorm': WEBGL_compressed_texture_astc.COMPRESSED_RGBA_ASTC_12x12_KHR,
  'astc-12x12-unorm-srgb': WEBGL_compressed_texture_astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR,
}

const mapFromWebGL: Record<number, SurfaceFormat> = Object.fromEntries(
  Object.entries(mapToWebGL).map(([format, glFormat]) => [glFormat, format as SurfaceFormat]),
)

const mapToWebGLFormat: Record<SurfaceFormat, number> = {
  // 8-bit formats
  r8unorm: gl.RED,
  r8snorm: gl.RED,
  r8uint: gl.RED,
  r8sint: gl.RED,
  // 16-bit formats
  r16unorm: gl.RED,
  r16snorm: gl.RED,
  r16uint: gl.RED,
  r16sint: gl.RED,
  r16float: gl.RED,
  rg8unorm: gl.RG,
  rg8snorm: gl.RG,
  rg8uint: gl.RG,
  rg8sint: gl.RG,
  // 32-bit formats
  r32uint: gl.RED,
  r32sint: gl.RED,
  r32float: gl.RED,
  rg16unorm: gl.RG,
  rg16snorm: gl.RG,
  rg16uint: gl.RG,
  rg16sint: gl.RG,
  rg16float: gl.RG,
  rgba8unorm: gl.RGBA,
  'rgba8unorm-srgb': gl.RGBA,
  rgba8snorm: gl.RGBA,
  rgba8uint: gl.RGBA,
  rgba8sint: gl.RGBA,
  bgra8unorm: EXT_texture_format_BGRA8888.BGRA_EXT,
  'bgra8unorm-srgb': EXT_texture_format_BGRA8888.BGRA_EXT,
  // Packed 32-bit formats
  rgb9e5ufloat: null, // not supported yet
  rgb10a2uint: null, // not supported yet
  rgb10a2unorm: null, // not supported yet
  rg11b10ufloat: null, // not supported yet
  // 64-bit formats
  rg32uint: gl.RG,
  rg32sint: gl.RG,
  rg32float: gl.RG,
  rgba16unorm: gl.RGBA,
  rgba16snorm: gl.RGBA,
  rgba16uint: gl.RGBA,
  rgba16sint: gl.RGBA,
  rgba16float: gl.RGBA,
  // 128-bit formats
  rgba32uint: gl.RGBA,
  rgba32sint: gl.RGBA,
  rgba32float: gl.RGBA,
  // Depth/stencil formats
  stencil8: null,
  depth16unorm: null,
  depth24plus: null,
  'depth24plus-stencil8': null,
  depth32float: null,
  'depth32float-stencil8': null,
  // BC
  'bc1-rgba-unorm': null,
  'bc2-rgba-unorm': null,
  'bc3-rgba-unorm': null,
  'bc1-rgba-unorm-srgb': null,
  'bc2-rgba-unorm-srgb': null,
  'bc3-rgba-unorm-srgb': null,
  'bc4-r-unorm': null,
  'bc4-r-snorm': null,
  'bc5-rg-unorm': null,
  'bc5-rg-snorm': null,
  'bc6h-rgb-ufloat': null,
  'bc6h-rgb-float': null,
  'bc7-rgba-unorm': null,
  'bc7-rgba-unorm-srgb': null,
  // ETC2
  'eac-r11unorm': null,
  'eac-r11snorm': null,
  'eac-rg11unorm': null,
  'eac-rg11snorm': null,
  'etc2-rgb8unorm': null,
  'etc2-rgb8unorm-srgb': null,
  'etc2-rgb8a1unorm': null,
  'etc2-rgb8a1unorm-srgb': null,
  'etc2-rgba8unorm': null,
  'etc2-rgba8unorm-srgb': null,
  // ASTC
  'astc-4x4-unorm': null,
  'astc-4x4-unorm-srgb': null,
  'astc-5x4-unorm': null,
  'astc-5x4-unorm-srgb': null,
  'astc-5x5-unorm': null,
  'astc-5x5-unorm-srgb': null,
  'astc-6x5-unorm': null,
  'astc-6x5-unorm-srgb': null,
  'astc-6x6-unorm': null,
  'astc-6x6-unorm-srgb': null,
  'astc-8x5-unorm': null,
  'astc-8x5-unorm-srgb': null,
  'astc-8x6-unorm': null,
  'astc-8x6-unorm-srgb': null,
  'astc-8x8-unorm': null,
  'astc-8x8-unorm-srgb': null,
  'astc-10x5-unorm': null,
  'astc-10x5-unorm-srgb': null,
  'astc-10x6-unorm': null,
  'astc-10x6-unorm-srgb': null,
  'astc-10x8-unorm': null,
  'astc-10x8-unorm-srgb': null,
  'astc-10x10-unorm': null,
  'astc-10x10-unorm-srgb': null,
  'astc-12x10-unorm': null,
  'astc-12x10-unorm-srgb': null,
  'astc-12x12-unorm': null,
  'astc-12x12-unorm-srgb': null,
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

const mapFromDXGI: Record<number, SurfaceFormat> = {
  // 8-bit formats
  [DXGI_FORMAT_R8_UNORM]: 'r8unorm',
  [DXGI_FORMAT_R8_SNORM]: 'r8snorm',
  [DXGI_FORMAT_R8_UINT]: 'r8uint',
  [DXGI_FORMAT_R8_SINT]: 'r8sint',
  [DXGI_FORMAT_A8_UNORM]: 'r8unorm',
  // 16-bit formats
  [DXGI_FORMAT_R16_UNORM]: 'r16unorm',
  [DXGI_FORMAT_R16_SNORM]: 'r16snorm',
  [DXGI_FORMAT_R16_UINT]: 'r16uint',
  [DXGI_FORMAT_R16_SINT]: 'r16sint',
  [DXGI_FORMAT_R16_FLOAT]: 'r16float',
  [DXGI_FORMAT_R8G8_UNORM]: 'rg8unorm',
  [DXGI_FORMAT_R8G8_SNORM]: 'rg8snorm',
  [DXGI_FORMAT_R8G8_UINT]: 'rg8uint',
  [DXGI_FORMAT_R8G8_SINT]: 'rg8sint',
  // 32-bit formats
  [DXGI_FORMAT_R32_UINT]: 'r32uint',
  [DXGI_FORMAT_R32_SINT]: 'r32sint',
  [DXGI_FORMAT_R32_FLOAT]: 'r32float',
  [DXGI_FORMAT_R16G16_UNORM]: 'rg16unorm',
  [DXGI_FORMAT_R16G16_SNORM]: 'rg16snorm',
  [DXGI_FORMAT_R16G16_UINT]: 'rg16uint',
  [DXGI_FORMAT_R16G16_SINT]: 'rg16sint',
  [DXGI_FORMAT_R16G16_FLOAT]: 'rg16float',
  [DXGI_FORMAT_R8G8B8A8_UNORM]: 'rgba8unorm',
  [DXGI_FORMAT_R8G8B8A8_UNORM_SRGB]: 'rgba8unorm-srgb',
  [DXGI_FORMAT_R8G8B8A8_SNORM]: 'rgba8snorm',
  [DXGI_FORMAT_R8G8B8A8_UINT]: 'rgba8uint',
  [DXGI_FORMAT_R8G8B8A8_SINT]: 'rgba8sint',
  [DXGI_FORMAT_B8G8R8A8_UNORM]: 'bgra8unorm',
  [DXGI_FORMAT_B8G8R8A8_UNORM_SRGB]: 'bgra8unorm-srgb',
  // Packed 32-bit formats
  [DXGI_FORMAT_R9G9B9E5_SHAREDEXP]: 'rgb9e5ufloat',
  [DXGI_FORMAT_R10G10B10A2_UINT]: 'rgb10a2uint',
  [DXGI_FORMAT_R10G10B10A2_UNORM]: 'rgb10a2unorm',
  [DXGI_FORMAT_R11G11B10_FLOAT]: 'rg11b10ufloat',
  // 64-bit formats
  [DXGI_FORMAT_R32G32_UINT]: 'rg32uint',
  [DXGI_FORMAT_R32G32_SINT]: 'rg32sint',
  [DXGI_FORMAT_R32G32_FLOAT]: 'rg32float',
  [DXGI_FORMAT_R16G16B16A16_UNORM]: 'rgba16unorm',
  [DXGI_FORMAT_R16G16B16A16_SNORM]: 'rgba16snorm',
  [DXGI_FORMAT_R16G16B16A16_UINT]: 'rgba16uint',
  [DXGI_FORMAT_R16G16B16A16_SINT]: 'rgba16sint',
  [DXGI_FORMAT_R16G16B16A16_FLOAT]: 'rgba16float',
  // 128-bit formats
  [DXGI_FORMAT_R32G32B32A32_UINT]: 'rgba32uint',
  [DXGI_FORMAT_R32G32B32A32_SINT]: 'rgba32sint',
  [DXGI_FORMAT_R32G32B32A32_FLOAT]: 'rgba32float',
  // BC
  [DXGI_FORMAT_BC1_UNORM]: 'bc1-rgba-unorm',
  [DXGI_FORMAT_BC2_UNORM]: 'bc2-rgba-unorm',
  [DXGI_FORMAT_BC3_UNORM]: 'bc3-rgba-unorm',
  [DXGI_FORMAT_BC1_UNORM_SRGB]: 'bc1-rgba-unorm-srgb',
  [DXGI_FORMAT_BC2_UNORM_SRGB]: 'bc2-rgba-unorm-srgb',
  [DXGI_FORMAT_BC3_UNORM_SRGB]: 'bc3-rgba-unorm-srgb',
  [DXGI_FORMAT_BC4_UNORM]: 'bc4-r-unorm',
  [DXGI_FORMAT_BC4_SNORM]: 'bc4-r-snorm',
  [DXGI_FORMAT_BC5_UNORM]: 'bc5-rg-unorm',
  [DXGI_FORMAT_BC5_SNORM]: 'bc5-rg-snorm',
  [DXGI_FORMAT_BC6H_UF16]: 'bc6h-rgb-ufloat',
  [DXGI_FORMAT_BC6H_SF16]: 'bc6h-rgb-float',
  [DXGI_FORMAT_BC7_UNORM]: 'bc7-rgba-unorm',
  [DXGI_FORMAT_BC7_UNORM_SRGB]: 'bc7-rgba-unorm-srgb',
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
  [VK_FORMAT_R8_UNORM]: 'r8unorm',
  [VK_FORMAT_R8_SNORM]: 'r8snorm',
  [VK_FORMAT_R8_UINT]: 'r8uint',
  [VK_FORMAT_R8_SINT]: 'r8sint',

  // 16-bit formats
  [VK_FORMAT_R16_UNORM]: 'r16unorm',
  [VK_FORMAT_R16_SNORM]: 'r16snorm',
  [VK_FORMAT_R16_UINT]: 'r16uint',
  [VK_FORMAT_R16_SINT]: 'r16sint',
  [VK_FORMAT_R16_SFLOAT]: 'r16float',
  [VK_FORMAT_R8G8_UNORM]: 'rg8unorm',
  [VK_FORMAT_R8G8_SNORM]: 'rg8snorm',
  [VK_FORMAT_R8G8_UINT]: 'rg8uint',
  [VK_FORMAT_R8G8_SINT]: 'rg8sint',

  // 32-bit formats
  [VK_FORMAT_R32_UINT]: 'r32uint',
  [VK_FORMAT_R32_SINT]: 'r32sint',
  [VK_FORMAT_R32_SFLOAT]: 'r32float',
  [VK_FORMAT_R16G16_UNORM]: 'rg16unorm',
  [VK_FORMAT_R16G16_SNORM]: 'rg16snorm',
  [VK_FORMAT_R16G16_UINT]: 'rg16uint',
  [VK_FORMAT_R16G16_SINT]: 'rg16sint',
  [VK_FORMAT_R16G16_SFLOAT]: 'rg16float',

  [VK_FORMAT_R8G8B8A8_UNORM]: 'rgba8unorm',
  [VK_FORMAT_R8G8B8A8_SRGB]: 'rgba8unorm-srgb',
  [VK_FORMAT_R8G8B8A8_SNORM]: 'rgba8snorm',
  [VK_FORMAT_R8G8B8A8_UINT]: 'rgba8uint',
  [VK_FORMAT_R8G8B8A8_SINT]: 'rgba8sint',
  [VK_FORMAT_B8G8R8A8_UNORM]: 'bgra8unorm',
  [VK_FORMAT_B8G8R8A8_SRGB]: 'bgra8unorm-srgb',

  // Packed 32-bit formats
  // 64-bit formats
  [VK_FORMAT_R32G32_UINT]: 'rg32uint',
  [VK_FORMAT_R32G32_SINT]: 'rg32sint',
  [VK_FORMAT_R32G32_SFLOAT]: 'rg32float',
  [VK_FORMAT_R16G16B16A16_UNORM]: 'rgba16unorm',
  [VK_FORMAT_R16G16B16A16_SNORM]: 'rgba16snorm',
  [VK_FORMAT_R16G16B16A16_UINT]: 'rgba16uint',
  [VK_FORMAT_R16G16B16A16_SINT]: 'rgba16sint',
  [VK_FORMAT_R16G16B16A16_SFLOAT]: 'rgba16float',

  // 128-bit formats
  [VK_FORMAT_R32G32B32A32_UINT]: 'rgba32uint',
  [VK_FORMAT_R32G32B32A32_SINT]: 'rgba32sint',
  [VK_FORMAT_R32G32B32A32_SFLOAT]: 'rgba32float',
  // Depth/stencil formats
  [VK_FORMAT_S8_UINT]: 'stencil8',
  [VK_FORMAT_D16_UNORM]: 'depth16unorm',
  [VK_FORMAT_D24_UNORM_S8_UINT]: 'depth24plus-stencil8',
  [VK_FORMAT_D32_SFLOAT]: 'depth32float',
  [VK_FORMAT_D32_SFLOAT_S8_UINT]: 'depth32float-stencil8',
  // BC
  [VK_FORMAT_BC1_RGBA_UNORM_BLOCK]: 'bc1-rgba-unorm',
  [VK_FORMAT_BC2_UNORM_BLOCK]: 'bc2-rgba-unorm',
  [VK_FORMAT_BC3_UNORM_BLOCK]: 'bc3-rgba-unorm',
  [VK_FORMAT_BC1_RGBA_SRGB_BLOCK]: 'bc1-rgba-unorm-srgb',
  [VK_FORMAT_BC2_SRGB_BLOCK]: 'bc2-rgba-unorm-srgb',
  [VK_FORMAT_BC3_SRGB_BLOCK]: 'bc3-rgba-unorm-srgb',
  [VK_FORMAT_BC4_UNORM_BLOCK]: 'bc4-r-unorm',
  [VK_FORMAT_BC4_SNORM_BLOCK]: 'bc4-r-snorm',
  [VK_FORMAT_BC5_UNORM_BLOCK]: 'bc5-rg-unorm',
  [VK_FORMAT_BC5_SNORM_BLOCK]: 'bc5-rg-snorm',
  [VK_FORMAT_BC6H_UFLOAT_BLOCK]: 'bc6h-rgb-ufloat',
  [VK_FORMAT_BC6H_SFLOAT_BLOCK]: 'bc6h-rgb-float',
  [VK_FORMAT_BC7_UNORM_BLOCK]: 'bc7-rgba-unorm',
  [VK_FORMAT_BC7_SRGB_BLOCK]: 'bc7-rgba-unorm-srgb',
  // ETC2
  [VK_FORMAT_ETC2_R8G8B8_UNORM_BLOCK]: 'etc2-rgb8unorm',
  [VK_FORMAT_ETC2_R8G8B8_SRGB_BLOCK]: 'etc2-rgb8unorm-srgb',
  [VK_FORMAT_ETC2_R8G8B8A1_UNORM_BLOCK]: 'etc2-rgb8a1unorm',
  [VK_FORMAT_ETC2_R8G8B8A1_SRGB_BLOCK]: 'etc2-rgb8a1unorm-srgb',
  [VK_FORMAT_ETC2_R8G8B8A8_UNORM_BLOCK]: 'etc2-rgb8unorm',
  [VK_FORMAT_ETC2_R8G8B8A8_SRGB_BLOCK]: 'etc2-rgba8unorm-srgb',
  // EAC
  [VK_FORMAT_EAC_R11_UNORM_BLOCK]: 'eac-r11unorm',
  [VK_FORMAT_EAC_R11_SNORM_BLOCK]: 'eac-r11snorm',
  [VK_FORMAT_EAC_R11G11_UNORM_BLOCK]: 'eac-rg11unorm',
  [VK_FORMAT_EAC_R11G11_SNORM_BLOCK]: 'eac-rg11snorm',
  // ASTC
  [VK_FORMAT_ASTC_4x4_UNORM_BLOCK]: 'astc-4x4-unorm',
  [VK_FORMAT_ASTC_4x4_SRGB_BLOCK]: 'astc-4x4-unorm-srgb',
  [VK_FORMAT_ASTC_5x4_UNORM_BLOCK]: 'astc-5x4-unorm',
  [VK_FORMAT_ASTC_5x4_SRGB_BLOCK]: 'astc-5x4-unorm-srgb',
  [VK_FORMAT_ASTC_5x5_UNORM_BLOCK]: 'astc-5x5-unorm',
  [VK_FORMAT_ASTC_5x5_SRGB_BLOCK]: 'astc-5x5-unorm-srgb',
  [VK_FORMAT_ASTC_6x5_UNORM_BLOCK]: 'astc-6x5-unorm',
  [VK_FORMAT_ASTC_6x5_SRGB_BLOCK]: 'astc-6x5-unorm-srgb',
  [VK_FORMAT_ASTC_6x6_UNORM_BLOCK]: 'astc-6x6-unorm',
  [VK_FORMAT_ASTC_6x6_SRGB_BLOCK]: 'astc-6x6-unorm-srgb',
  [VK_FORMAT_ASTC_8x5_UNORM_BLOCK]: 'astc-8x5-unorm',
  [VK_FORMAT_ASTC_8x5_SRGB_BLOCK]: 'astc-8x5-unorm-srgb',
  [VK_FORMAT_ASTC_8x6_UNORM_BLOCK]: 'astc-8x6-unorm',
  [VK_FORMAT_ASTC_8x6_SRGB_BLOCK]: 'astc-8x6-unorm-srgb',
  [VK_FORMAT_ASTC_8x8_UNORM_BLOCK]: 'astc-8x8-unorm',
  [VK_FORMAT_ASTC_8x8_SRGB_BLOCK]: 'astc-8x8-unorm-srgb',
  [VK_FORMAT_ASTC_10x5_UNORM_BLOCK]: 'astc-10x5-unorm',
  [VK_FORMAT_ASTC_10x5_SRGB_BLOCK]: 'astc-10x5-unorm-srgb',
  [VK_FORMAT_ASTC_10x6_UNORM_BLOCK]: 'astc-10x6-unorm',
  [VK_FORMAT_ASTC_10x6_SRGB_BLOCK]: 'astc-10x6-unorm-srgb',
  [VK_FORMAT_ASTC_10x8_UNORM_BLOCK]: 'astc-10x8-unorm',
  [VK_FORMAT_ASTC_10x8_SRGB_BLOCK]: 'astc-10x8-unorm-srgb',
  [VK_FORMAT_ASTC_10x10_UNORM_BLOCK]: 'astc-10x10-unorm',
  [VK_FORMAT_ASTC_10x10_SRGB_BLOCK]: 'astc-10x10-unorm-srgb',
  [VK_FORMAT_ASTC_12x10_UNORM_BLOCK]: 'astc-12x10-unorm',
  [VK_FORMAT_ASTC_12x10_SRGB_BLOCK]: 'astc-12x10-unorm-srgb',
  [VK_FORMAT_ASTC_12x12_UNORM_BLOCK]: 'astc-12x12-unorm',
  [VK_FORMAT_ASTC_12x12_SRGB_BLOCK]: 'astc-12x12-unorm-srgb',
}

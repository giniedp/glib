import { GLConst as gl } from '@gglib/graphics'
import { VkFormat } from './VkFormat'

export interface KTXFormatInfo {
  surfaceFormat: GLenum
  format: GLenum
  type: GLenum
}

export const VK_TO_GL1: { [k: number]: KTXFormatInfo } = {
  [VkFormat.R4G4B4A4_UNORM_PACK16]: {
    surfaceFormat: gl.RGBA4,
    format: gl.RGBA,
    type: gl.UNSIGNED_SHORT_4_4_4_4,
  },
  [VkFormat.R5G6B5_UNORM_PACK16]: {
    surfaceFormat: gl.RGB565,
    format: gl.RGB,
    type: gl.UNSIGNED_SHORT_5_6_5,
  },
  [VkFormat.R5G5B5A1_UNORM_PACK16]: {
    surfaceFormat: gl.RGB5_A1,
    format: gl.RGBA,
    type: gl.UNSIGNED_SHORT_5_5_5_1,
  },
  [VkFormat.R8G8B8_UNORM]: {
    surfaceFormat: gl.RGB8,
    format: gl.RGB,
    type: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8B8A8_UNORM]: {
    surfaceFormat: gl.RGBA8,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
  },
}

export const VK_TO_GL2: { [k: number]: KTXFormatInfo } = {
  [VkFormat.R8_UNORM]: {
    surfaceFormat: gl.R8,
    format: gl.RED,
    type: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8_SNORM]: {
    surfaceFormat: gl.R8_SNORM,
    format: gl.RED,
    type: gl.BYTE,
  },
  [VkFormat.R8_UINT]: {
    surfaceFormat: gl.R8UI,
    format: gl.RED_INTEGER,
    type: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8_SINT]: {
    surfaceFormat: gl.R8I,
    format: gl.RED_INTEGER,
    type: gl.BYTE,
  },
  [VkFormat.R8G8_UNORM]: {
    surfaceFormat: gl.RG8,
    format: gl.RG,
    type: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8_SNORM]: {
    surfaceFormat: gl.RG8_SNORM,
    format: gl.RG,
    type: gl.BYTE,
  },
  [VkFormat.R8G8_UINT]: {
    surfaceFormat: gl.RG8UI,
    format: gl.RG_INTEGER,
    type: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8_SINT]: {
    surfaceFormat: gl.RG8I,
    format: gl.RG_INTEGER,
    type: gl.BYTE,
  },
  [VkFormat.R8G8B8_SNORM]: {
    surfaceFormat: gl.RGB8_SNORM,
    format: gl.RGB,
    type: gl.BYTE,
  },
  [VkFormat.R8G8B8_UINT]: {
    surfaceFormat: gl.RGB8UI,
    format: gl.RGB_INTEGER,
    type: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8B8_SINT]: {
    surfaceFormat: gl.RGB8I,
    format: gl.RGB_INTEGER,
    type: gl.BYTE,
  },
  [VkFormat.R8G8B8A8_SNORM]: {
    surfaceFormat: gl.RGBA8_SNORM,
    format: gl.RGBA,
    type: gl.BYTE,
  },
  [VkFormat.R8G8B8A8_UINT]: {
    surfaceFormat: gl.RGBA8UI,
    format: gl.RGBA_INTEGER,
    type: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8B8A8_SINT]: {
    surfaceFormat: gl.RGBA8I,
    format: gl.RGBA_INTEGER,
    type: gl.BYTE,
  },
  [VkFormat.A2B10G10R10_UNORM_PACK32]: {
    surfaceFormat: gl.RGB10_A2,
    format: gl.RGBA,
    type: gl.UNSIGNED_INT_2_10_10_10_REV,
  },
  [VkFormat.A2B10G10R10_UINT_PACK32]: {
    surfaceFormat: gl.RGB10_A2UI,
    format: gl.RGBA_INTEGER,
    type: gl.UNSIGNED_INT_2_10_10_10_REV,
  },
  [VkFormat.R16_UINT]: {
    surfaceFormat: gl.R16UI,
    format: gl.RED_INTEGER,
    type: gl.UNSIGNED_SHORT,
  },
  [VkFormat.R16_SINT]: {
    surfaceFormat: gl.R16I,
    format: gl.RED_INTEGER,
    type: gl.SHORT,
  },
  [VkFormat.R16_SFLOAT]: {
    surfaceFormat: gl.R16F,
    format: gl.RED,
    type: gl.HALF_FLOAT,
  },
  [VkFormat.R16G16_UINT]: {
    surfaceFormat: gl.RG16UI,
    format: gl.RG_INTEGER,
    type: gl.UNSIGNED_SHORT,
  },
  [VkFormat.R16G16_SINT]: {
    surfaceFormat: gl.RG16I,
    format: gl.RG_INTEGER,
    type: gl.SHORT,
  },
  [VkFormat.R16G16_SFLOAT]: {
    surfaceFormat: gl.RG16F,
    format: gl.RG,
    type: gl.HALF_FLOAT,
  },
  [VkFormat.R16G16B16_UINT]: {
    surfaceFormat: gl.RGB16UI,
    format: gl.RGB_INTEGER,
    type: gl.UNSIGNED_SHORT,
  },
  [VkFormat.R16G16B16_SINT]: {
    surfaceFormat: gl.RGB16I,
    format: gl.RGB_INTEGER,
    type: gl.SHORT,
  },
  [VkFormat.R16G16B16A16_UINT]: {
    surfaceFormat: gl.RGBA16UI,
    format: gl.RGBA_INTEGER,
    type: gl.UNSIGNED_SHORT,
  },
  [VkFormat.R16G16B16A16_SINT]: {
    surfaceFormat: gl.RGBA16I,
    format: gl.RGBA_INTEGER,
    type: gl.SHORT,
  },
  [VkFormat.R32_UINT]: {
    surfaceFormat: gl.R32UI,
    format: gl.RED_INTEGER,
    type: gl.UNSIGNED_INT,
  },
  [VkFormat.R32_SINT]: {
    surfaceFormat: gl.R32I,
    format: gl.RED_INTEGER,
    type: gl.INT,
  },
  [VkFormat.R32_SFLOAT]: {
    surfaceFormat: gl.R32F,
    format: gl.RED,
    type: gl.FLOAT,
  },
  [VkFormat.R32G32_UINT]: {
    surfaceFormat: gl.RG32UI,
    format: gl.RG_INTEGER,
    type: gl.UNSIGNED_INT,
  },
  [VkFormat.R32G32_SINT]: {
    surfaceFormat: gl.RG32I,
    format: gl.RG_INTEGER,
    type: gl.INT,
  },
  [VkFormat.R32G32_SFLOAT]: {
    surfaceFormat: gl.RG32F,
    format: gl.RG,
    type: gl.FLOAT,
  },
  [VkFormat.R32G32B32_UINT]: {
    surfaceFormat: gl.RGB32UI,
    format: gl.RGB_INTEGER,
    type: gl.UNSIGNED_INT,
  },
  [VkFormat.R32G32B32_SINT]: {
    surfaceFormat: gl.RGB32I,
    format: gl.RGB_INTEGER,
    type: gl.INT,
  },
  [VkFormat.R32G32B32A32_UINT]: {
    surfaceFormat: gl.RGBA32UI,
    format: gl.RGBA_INTEGER,
    type: gl.UNSIGNED_INT,
  },
  [VkFormat.R32G32B32A32_SINT]: {
    surfaceFormat: gl.RGBA32I,
    format: gl.RGBA_INTEGER,
    type: gl.INT,
  },
  [VkFormat.B10G11R11_UFLOAT_PACK32]: {
    surfaceFormat: gl.R11F_G11F_B10F,
    format: gl.RGB,
    type: gl.UNSIGNED_INT_10F_11F_11F_REV,
  },
  [VkFormat.E5B9G9R9_UFLOAT_PACK32]: {
    surfaceFormat: gl.RGB9_E5,
    format: gl.RGB,
    type: gl.UNSIGNED_INT_5_9_9_9_REV,
  },
  [VkFormat.X8_D24_UNORM_PACK32]: {
    surfaceFormat: gl.DEPTH_COMPONENT24,
    format: gl.DEPTH_COMPONENT,
    type: gl.UNSIGNED_INT,
  },
  [VkFormat.D32_SFLOAT]: {
    surfaceFormat: gl.DEPTH_COMPONENT32F,
    format: gl.DEPTH_COMPONENT,
    type: gl.FLOAT,
  },
  [VkFormat.D24_UNORM_S8_UINT]: {
    surfaceFormat: gl.DEPTH24_STENCIL8,
    format: gl.DEPTH_STENCIL,
    type: gl.UNSIGNED_INT_24_8,
  },
  [VkFormat.D32_SFLOAT_S8_UINT]: {
    surfaceFormat: gl.DEPTH32F_STENCIL8,
    format: gl.DEPTH_STENCIL,
    type: gl.FLOAT_32_UNSIGNED_INT_24_8_REV,
  },
}

export const VK_TO_GL2_WITH_EXT: { [k: number]: KTXFormatInfo & { glExtension: string } } = {
  [VkFormat.R8G8B8_SRGB]: {
    surfaceFormat: gl.SRGB8,
    format: gl.RGB,
    type: gl.UNSIGNED_BYTE,
    glExtension: 'EXT_sRGB',
  },
  [VkFormat.R8G8B8A8_SRGB]: {
    surfaceFormat: gl.SRGB8_ALPHA8,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
    glExtension: 'EXT_sRGB',
  },
  [VkFormat.R16G16B16_SFLOAT]: {
    surfaceFormat: gl.RGB16F,
    format: gl.RGB,
    type: gl.HALF_FLOAT,
    glExtension: 'OES_texture_half_float',
  },
  [VkFormat.R16G16B16A16_SFLOAT]: {
    surfaceFormat: gl.RGBA16F,
    format: gl.RGBA,
    type: gl.HALF_FLOAT,
    glExtension: 'OES_texture_half_float',
  },
  [VkFormat.R32G32B32_SFLOAT]: {
    surfaceFormat: gl.RGB32F,
    format: gl.RGB,
    type: gl.FLOAT,
    glExtension: 'OES_texture_float',
  },
  [VkFormat.R32G32B32A32_SFLOAT]: {
    surfaceFormat: gl.RGBA32F,
    format: gl.RGBA,
    type: gl.FLOAT,
    glExtension: 'OES_texture_float',
  },
  [VkFormat.D16_UNORM]: {
    surfaceFormat: gl.DEPTH_COMPONENT16,
    format: gl.DEPTH_COMPONENT,
    type: gl.UNSIGNED_SHORT,
    glExtension: 'WEBGL_depth_texture',
  },
}

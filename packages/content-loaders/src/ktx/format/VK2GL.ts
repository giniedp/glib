import { ArrayType, GLConst as gl } from '@gglib/graphics'
import { VkFormat } from './VkFormat'

export interface KTXFormatInfo {
  glInternalFormat: GLenum
  glFormat: GLenum
  glType: GLenum
}
export const VK_TO_GL1: { [k: number]: KTXFormatInfo } = {
  [VkFormat.R4G4B4A4_UNORM_PACK16]: {
    glInternalFormat: gl.RGBA4,
    glFormat: gl.RGBA,
    glType: gl.UNSIGNED_SHORT_4_4_4_4,
  },
  [VkFormat.R5G6B5_UNORM_PACK16]: {
    glInternalFormat: gl.RGB565,
    glFormat: gl.RGB,
    glType: gl.UNSIGNED_SHORT_5_6_5,
  },
  [VkFormat.R5G5B5A1_UNORM_PACK16]: {
    glInternalFormat: gl.RGB5_A1,
    glFormat: gl.RGBA,
    glType: gl.UNSIGNED_SHORT_5_5_5_1,
  },
  [VkFormat.R8G8B8_UNORM]: {
    glInternalFormat: gl.RGB8,
    glFormat: gl.RGB,
    glType: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8B8A8_UNORM]: {
    glInternalFormat: gl.RGBA8,
    glFormat: gl.RGBA,
    glType: gl.UNSIGNED_BYTE,
  },
}

export const VK_TO_GL2: { [k: number]: KTXFormatInfo } = {
  [VkFormat.R8_UNORM]: {
    glInternalFormat: gl.R8,
    glFormat: gl.RED,
    glType: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8_SNORM]: {
    glInternalFormat: gl.R8_SNORM,
    glFormat: gl.RED,
    glType: gl.BYTE,
  },
  [VkFormat.R8_UINT]: {
    glInternalFormat: gl.R8UI,
    glFormat: gl.RED_INTEGER,
    glType: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8_SINT]: {
    glInternalFormat: gl.R8I,
    glFormat: gl.RED_INTEGER,
    glType: gl.BYTE,
  },
  [VkFormat.R8G8_UNORM]: {
    glInternalFormat: gl.RG8,
    glFormat: gl.RG,
    glType: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8_SNORM]: {
    glInternalFormat: gl.RG8_SNORM,
    glFormat: gl.RG,
    glType: gl.BYTE,
  },
  [VkFormat.R8G8_UINT]: {
    glInternalFormat: gl.RG8UI,
    glFormat: gl.RG_INTEGER,
    glType: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8_SINT]: {
    glInternalFormat: gl.RG8I,
    glFormat: gl.RG_INTEGER,
    glType: gl.BYTE,
  },
  [VkFormat.R8G8B8_SNORM]: {
    glInternalFormat: gl.RGB8_SNORM,
    glFormat: gl.RGB,
    glType: gl.BYTE,
  },
  [VkFormat.R8G8B8_UINT]: {
    glInternalFormat: gl.RGB8UI,
    glFormat: gl.RGB_INTEGER,
    glType: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8B8_SINT]: {
    glInternalFormat: gl.RGB8I,
    glFormat: gl.RGB_INTEGER,
    glType: gl.BYTE,
  },
  [VkFormat.R8G8B8A8_SNORM]: {
    glInternalFormat: gl.RGBA8_SNORM,
    glFormat: gl.RGBA,
    glType: gl.BYTE,
  },
  [VkFormat.R8G8B8A8_UINT]: {
    glInternalFormat: gl.RGBA8UI,
    glFormat: gl.RGBA_INTEGER,
    glType: gl.UNSIGNED_BYTE,
  },
  [VkFormat.R8G8B8A8_SINT]: {
    glInternalFormat: gl.RGBA8I,
    glFormat: gl.RGBA_INTEGER,
    glType: gl.BYTE,
  },
  [VkFormat.A2B10G10R10_UNORM_PACK32]: {
    glInternalFormat: gl.RGB10_A2,
    glFormat: gl.RGBA,
    glType: gl.UNSIGNED_INT_2_10_10_10_REV,
  },
  [VkFormat.A2B10G10R10_UINT_PACK32]: {
    glInternalFormat: gl.RGB10_A2UI,
    glFormat: gl.RGBA_INTEGER,
    glType: gl.UNSIGNED_INT_2_10_10_10_REV,
  },
  [VkFormat.R16_UINT]: {
    glInternalFormat: gl.R16UI,
    glFormat: gl.RED_INTEGER,
    glType: gl.UNSIGNED_SHORT,
  },
  [VkFormat.R16_SINT]: {
    glInternalFormat: gl.R16I,
    glFormat: gl.RED_INTEGER,
    glType: gl.SHORT,
  },
  [VkFormat.R16_SFLOAT]: {
    glInternalFormat: gl.R16F,
    glFormat: gl.RED,
    glType: gl.HALF_FLOAT,
  },
  [VkFormat.R16G16_UINT]: {
    glInternalFormat: gl.RG16UI,
    glFormat: gl.RG_INTEGER,
    glType: gl.UNSIGNED_SHORT,
  },
  [VkFormat.R16G16_SINT]: {
    glInternalFormat: gl.RG16I,
    glFormat: gl.RG_INTEGER,
    glType: gl.SHORT,
  },
  [VkFormat.R16G16_SFLOAT]: {
    glInternalFormat: gl.RG16F,
    glFormat: gl.RG,
    glType: gl.HALF_FLOAT,
  },
  [VkFormat.R16G16B16_UINT]: {
    glInternalFormat: gl.RGB16UI,
    glFormat: gl.RGB_INTEGER,
    glType: gl.UNSIGNED_SHORT,
  },
  [VkFormat.R16G16B16_SINT]: {
    glInternalFormat: gl.RGB16I,
    glFormat: gl.RGB_INTEGER,
    glType: gl.SHORT,
  },
  [VkFormat.R16G16B16A16_UINT]: {
    glInternalFormat: gl.RGBA16UI,
    glFormat: gl.RGBA_INTEGER,
    glType: gl.UNSIGNED_SHORT,
  },
  [VkFormat.R16G16B16A16_SINT]: {
    glInternalFormat: gl.RGBA16I,
    glFormat: gl.RGBA_INTEGER,
    glType: gl.SHORT,
  },
  [VkFormat.R32_UINT]: {
    glInternalFormat: gl.R32UI,
    glFormat: gl.RED_INTEGER,
    glType: gl.UNSIGNED_INT,
  },
  [VkFormat.R32_SINT]: {
    glInternalFormat: gl.R32I,
    glFormat: gl.RED_INTEGER,
    glType: gl.INT,
  },
  [VkFormat.R32_SFLOAT]: {
    glInternalFormat: gl.R32F,
    glFormat: gl.RED,
    glType: gl.FLOAT,
  },
  [VkFormat.R32G32_UINT]: {
    glInternalFormat: gl.RG32UI,
    glFormat: gl.RG_INTEGER,
    glType: gl.UNSIGNED_INT,
  },
  [VkFormat.R32G32_SINT]: {
    glInternalFormat: gl.RG32I,
    glFormat: gl.RG_INTEGER,
    glType: gl.INT,
  },
  [VkFormat.R32G32_SFLOAT]: {
    glInternalFormat: gl.RG32F,
    glFormat: gl.RG,
    glType: gl.FLOAT,
  },
  [VkFormat.R32G32B32_UINT]: {
    glInternalFormat: gl.RGB32UI,
    glFormat: gl.RGB_INTEGER,
    glType: gl.UNSIGNED_INT,
  },
  [VkFormat.R32G32B32_SINT]: {
    glInternalFormat: gl.RGB32I,
    glFormat: gl.RGB_INTEGER,
    glType: gl.INT,
  },
  [VkFormat.R32G32B32A32_UINT]: {
    glInternalFormat: gl.RGBA32UI,
    glFormat: gl.RGBA_INTEGER,
    glType: gl.UNSIGNED_INT,
  },
  [VkFormat.R32G32B32A32_SINT]: {
    glInternalFormat: gl.RGBA32I,
    glFormat: gl.RGBA_INTEGER,
    glType: gl.INT,
  },
  [VkFormat.B10G11R11_UFLOAT_PACK32]: {
    glInternalFormat: gl.R11F_G11F_B10F,
    glFormat: gl.RGB,
    glType: gl.UNSIGNED_INT_10F_11F_11F_REV,
  },
  [VkFormat.E5B9G9R9_UFLOAT_PACK32]: {
    glInternalFormat: gl.RGB9_E5,
    glFormat: gl.RGB,
    glType: gl.UNSIGNED_INT_5_9_9_9_REV,
  },
  [VkFormat.X8_D24_UNORM_PACK32]: {
    glInternalFormat: gl.DEPTH_COMPONENT24,
    glFormat: gl.DEPTH_COMPONENT,
    glType: gl.UNSIGNED_INT,
  },
  [VkFormat.D32_SFLOAT]: {
    glInternalFormat: gl.DEPTH_COMPONENT32F,
    glFormat: gl.DEPTH_COMPONENT,
    glType: gl.FLOAT,
  },
  [VkFormat.D24_UNORM_S8_UINT]: {
    glInternalFormat: gl.DEPTH24_STENCIL8,
    glFormat: gl.DEPTH_STENCIL,
    glType: gl.UNSIGNED_INT_24_8,
  },
  [VkFormat.D32_SFLOAT_S8_UINT]: {
    glInternalFormat: gl.DEPTH32F_STENCIL8,
    glFormat: gl.DEPTH_STENCIL,
    glType: gl.FLOAT_32_UNSIGNED_INT_24_8_REV,
  },
}

export const VK_TO_GL2_WITH_EXT: { [k: number]: KTXFormatInfo & { glExtension: string } } = {
  [VkFormat.R8G8B8_SRGB]: {
    glInternalFormat: gl.SRGB8,
    glFormat: gl.RGB,
    glType: gl.UNSIGNED_BYTE,
    glExtension: 'EXT_sRGB',
  },
  [VkFormat.R8G8B8A8_SRGB]: {
    glInternalFormat: gl.SRGB8_ALPHA8,
    glFormat: gl.RGBA,
    glType: gl.UNSIGNED_BYTE,
    glExtension: 'EXT_sRGB',
  },
  [VkFormat.R16G16B16_SFLOAT]: {
    glInternalFormat: gl.RGB16F,
    glFormat: gl.RGB,
    glType: gl.HALF_FLOAT,
    glExtension: 'OES_texture_half_float',
  },
  [VkFormat.R16G16B16A16_SFLOAT]: {
    glInternalFormat: gl.RGBA16F,
    glFormat: gl.RGBA,
    glType: gl.HALF_FLOAT,
    glExtension: 'OES_texture_half_float',
  },
  [VkFormat.R32G32B32_SFLOAT]: {
    glInternalFormat: gl.RGB32F,
    glFormat: gl.RGB,
    glType: gl.FLOAT,
    glExtension: 'OES_texture_float',
  },
  [VkFormat.R32G32B32A32_SFLOAT]: {
    glInternalFormat: gl.RGBA32F,
    glFormat: gl.RGBA,
    glType: gl.FLOAT,
    glExtension: 'OES_texture_float',
  },
  [VkFormat.D16_UNORM]: {
    glInternalFormat: gl.DEPTH_COMPONENT16,
    glFormat: gl.DEPTH_COMPONENT,
    glType: gl.UNSIGNED_SHORT,
    glExtension: 'WEBGL_depth_texture',
  },
}

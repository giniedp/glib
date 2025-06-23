import { Property } from './common'
import { TextureInfo } from './TextureInfo'

export const EXT_nw_material = 'EXT_nw_material'

export function getNwExtension(property: Property) {
  if (property.extensions && property.extensions[EXT_nw_material]) {
    return property.extensions[EXT_nw_material] as EXT_nw_material
  }
  return null
}

/**
 * @see https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_anisotropy/README.md
 */
export interface EXT_nw_material {
  params?: Record<string, any>
  maskTexture?: TextureInfo
  smoothTexture?: TextureInfo
}

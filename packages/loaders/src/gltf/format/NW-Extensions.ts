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
 * The New World material of a glTF material (nw-buddy nwbt exporter)
 */
export interface EXT_nw_material {
  attrs?: Record<string, any>
  textures?: TextureInfo[]
  params?: Record<string, any>
  vertexDeform?: Record<string, any>
  maskTexture?: TextureInfo
  smoothTexture?: TextureInfo
  vertColors?: boolean
}

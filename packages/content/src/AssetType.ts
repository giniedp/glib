import { Material, MaterialOptions, Texture, TextureOptions } from '@gglib/graphics'
import { Model, ModelOptions } from '@gglib/model'
import { brand, Brand } from '@gglib/utils'

export type AssetType<O = any, T = any> = Brand<string, T>
export const AssetType = {
  Model: brand<AssetType<ModelOptions, Model>>('model'),
  Texture: brand<AssetType<TextureOptions, Texture>>('texture'),
  Material: brand<AssetType<MaterialOptions, Material>>('material'),
}

import { Material, MaterialOptions, Texture, TextureOptions } from '@gglib/graphics'
import { Model, ModelOptions } from '@gglib/model'
import { Brand } from '@gglib/utils'

export type AssetType<O = any, T = any> = Brand<string, T> & {
  __options: O
}
export const AssetType = {
  Model: 'model' as AssetType<ModelOptions, Model>,
  Texture: 'texture' as AssetType<TextureOptions, Texture>,
  Material: 'material' as AssetType<MaterialOptions, Material>,
}
export type OptionsOf<A> = A extends AssetType<infer O, any> ? O : never

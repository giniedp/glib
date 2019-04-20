import { Material, MaterialOptions } from '@gglib/graphics'

import { loader } from '../../utils'

export const ggmatToMaterialOptions = loader<null, MaterialOptions>({
  input: '.ggmat',
  output: Material.Options,
  handle: async (_, context) => {
    return (await context.manager.load(context.source, Material.OptionsArray))[0]
  },
})

export const ggmatToMaterialOptionsArray = loader<null, MaterialOptions[]>({
  input: '.ggmat',
  output: Material.OptionsArray,
  handle: async (_, context) => {
    const text = (await context.manager.download(context.source)).content
    const result = JSON.parse(text)
    return Array.isArray(result) ? result : [result]
  },
})

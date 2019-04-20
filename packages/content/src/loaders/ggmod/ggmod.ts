import { Model, ModelOptions } from '@gglib/graphics'
import { loader } from '../../utils'

export const ggmodToModelOptions = loader<null, ModelOptions>({
  input: '.ggmod',
  output: Model.Options,
  handle: async (_, context) => {
    const text = (await context.manager.downloadText(context.source)).content
    return JSON.parse(text)
  },
})

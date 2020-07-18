import { Model, ModelOptions } from '@gglib/graphics'
import { loader } from '../../utils'

/**
 * @public
 */
export const loadGgmodToModelOptions = loader({
  input: '.ggmod',
  output: Model.Options,
  handle: async (_, context): Promise<ModelOptions> => {
    const text = (await context.manager.downloadText(context.source)).content
    return JSON.parse(text)
  },
})

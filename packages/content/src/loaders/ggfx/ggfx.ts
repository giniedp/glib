import { createShaderEffectOptions, ShaderEffect, ShaderEffectOptions, ShaderFxDocument } from '@gglib/graphics'

import { YML } from '../../formats/yml'
import { PipelineContext  } from '../../PipelineContext'
import { loader, resolveUri } from '../../utils'

export const ggfxToShaderEffectOptions = loader<null, ShaderEffectOptions>({
  input: ['.ggfx', 'application/x-yaml'],
  output: ShaderEffect.Options,
  handle: async (_, context) => {
    const text = (await context.manager.downloadText(context.source)).content
    const includeHandler = createIncludeHandler(context)
    const doc = YML.parse(text) as ShaderFxDocument
    return createShaderEffectOptions(doc, includeHandler)
  },
})

function createIncludeHandler(context: PipelineContext): (includePath: string) => Promise<string> {
  return (includePath: string) => {
    const url = resolveUri(includePath, context)
    const cache = context.options.includeCache || {}
    context.options.includeCache = cache
    return cache[url] = cache[url] || context.manager.download(url).then((res) => res.content)
  }
}

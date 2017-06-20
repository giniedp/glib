import { ShaderEffect } from '@glib/graphics'

import { YML } from '../parser'
import { Pipeline, PipelineContext, pipelineImporter, pipelineLoader } from '../Pipeline'
import { RawAsset } from './../Manager'

pipelineLoader( ['.yml', '.glfx', 'application/x-yaml', 'application/x-yaml'], ShaderEffect, (context: PipelineContext): Promise<void> => {
  return context.manager.download(context.source).then((res: RawAsset) => {
    context.downloaded = res
    return context.pipeline.import(context)
  })
})

pipelineImporter(['.yml', '.glfx', 'application/x-yaml'], ShaderEffect, (context: PipelineContext): Promise<void> => {
  context.imported = YML.parse(context.downloaded.content)
  return context.pipeline.process(context)
})

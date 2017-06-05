import { YML } from '../parser'
import { Pipeline, PipelineContext, pipelineImporter, pipelineLoader } from '../Pipeline'
import { RawAsset } from './../Manager'

pipelineLoader(['.yml', '.glfx'], 'Effect', (context: PipelineContext): Promise<void> => {
  return context.manager.download(context.path).then((res: RawAsset) => {
    context.raw = res
    return context.pipeline.import(context)
  })
})

pipelineImporter(['.yml', '.glfx'], 'Effect', (context: PipelineContext): Promise<void> => {
  context.intermediate = YML.parse(context.raw.content)
  return context.pipeline.process(context)
})

import { extend, Uri } from '@gglib/core'
import { Model } from '@gglib/graphics'
import { Pipeline, PipelineContext, pipelineImporter, pipelinePreprocessor, pipelineProcessor } from '../Pipeline'

pipelineImporter(['.json', 'application/json'], Model, (context: PipelineContext) => {
  context.imported = JSON.parse(context.downloaded.content)
  return context.pipeline.process(context)
})

pipelineProcessor(Model, (context: PipelineContext) => {
  context.result = new Model(context.manager.device, context.imported)
})

pipelinePreprocessor(Model, (context: PipelineContext) => {
  let json = context.imported || {}
  let materials = json.material || json.materials
  if (!Array.isArray(materials)) {
    materials = [materials]
  }
  return Promise.all(materials.filter((it: any) => !!it).map((mtl: any) => {
    if (typeof mtl === 'string') {
      return context.manager.load('Material[]', Uri.merge(context.source, mtl))
    } else {
      // prepare the new context
      let subContext: PipelineContext = {
        // derived options
        manager: context.manager,
        pipeline: context.pipeline,
        stage: context.stage,
        source: context.source,
        sourceType: context.sourceType,
        // override options
        targetType: 'Material',
        imported: mtl,
        options: {},
      }
      // send to the "Material" processor
      return context.pipeline.process(subContext).then(() => {
        return subContext.result
      })
    }
  })).then((loadedMaterials) => {
    json.materials = [].concat.apply([], loadedMaterials)
    delete json.material
  })
})

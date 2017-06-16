import { extend, Uri } from '@glib/core'
import { Model } from '@glib/graphics'
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
  return Promise.all(materials.map((mtl: any) => {
    if (typeof mtl === 'string') {
      return context.manager.load('Material[]', Uri.merge(context.source, mtl)).then((loadedMaterial) => loadedMaterial)
    } else {
      // prepare the new context
      let subContext = extend({}, context, {
        intermediate: mtl,
        targetType: 'Material',
      }) as PipelineContext
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

import { extend, logger, path } from '@glib/core'
import { Pipeline, PipelineContext, pipelineImporter, pipelinePreProcessor, pipelineProcessor } from '../Pipeline'

pipelineImporter('.json', 'Material[]', (context: PipelineContext): Promise<void> => {
  // parse text content into json
  context.intermediate = JSON.parse(context.raw.content)
  // materials can be defined as an array (a material collection) or as single material object
  // this importer explicitely imports a material collection: 'Material[]'
  // thus ensure that the intermediate object is an array
  if (!Array.isArray(context.intermediate)) {
    context.intermediate = [context.intermediate]
  }
  // send to the "Material[]" processor
  return context.pipeline.process(context)
})

pipelineProcessor('Material[]', (context: PipelineContext): Promise<void> => {
  context.result = []
  // send each entry to the process stage individaully
  return Promise.all(context.intermediate.map((mtl: any, index: number) => {
    // prepare the new context
    let subContext = extend({}, context, {
      intermediate: mtl,
      targetType: 'Material',
    }) as PipelineContext
    // send to the "Material" processor
    return context.pipeline.process(subContext).then(() => {
      context.result[index] = subContext.result
    })
  })).then(() => {
    //
  })
})

pipelineImporter('.json', 'Material', (context: PipelineContext): Promise<void> => {
  // parse text content into json
  context.intermediate = JSON.parse(context.raw.content)
  // materials can be defined as an array (a material collection) or as single material object
  // this importer explicitely imports a 'Material' object
  // thus only the first material is taken into the process stage
  if (Array.isArray(context.intermediate)) {
    context.intermediate = context.intermediate[0]
  }
  // send to the "Material" processor
  return context.pipeline.process(context)
})

pipelineProcessor('Material', (context: PipelineContext) => {
  let json = context.intermediate
  // the material name
  let name = json.name
  // the effect url to load
  let effect = json.effect
  // the material parameters
  let params = json.parameters || {}

  // load the effect from effect path
  return context.manager.load('Effect', effect).then((loadedEffect) => {
    // TODO: allow the user of the pipeline to tell wheter to clone the effect or use the loaded reference
    context.result = loadedEffect.clone()
    // take the previous name an material parameters
    context.result.name = name
    context.result.parameters = extend(context.result.parameters || {}, params)
  })
})

pipelinePreProcessor('Material', (context: PipelineContext) => {

  const data = context.intermediate
  const parameters = data.parameters
  if (!parameters) {
    return Promise.resolve()
  }

  // Lookup each parameter. If it is a string, it is assumed to be a url to a texture.
  // Loads the textures and replaces the urls with the texture objects
  // TODO: how to detect 3d and cube texture parameters ?

  const promises = []
  for (const key in parameters) {
    if (parameters.hasOwnProperty(key)) {

      let value = parameters[key]
      if (typeof value !== 'string') {
        continue
      }
      let url = path.merge(context.path, value)
      let promise = context.manager.load('Texture2D', url)
      .then((texture) => {
        parameters[key] = texture
      })
      .catch(() => {
        delete parameters[key]
        logger.warn(`failed to load effect parameter texture (${key}:${value})`)
      })
      promises.push(promise)
    }
  }
  return Promise.all(promises).then(() => undefined)
})

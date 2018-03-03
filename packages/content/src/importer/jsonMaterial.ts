import { extend, Log, Uri } from '@gglib/core'
import { ShaderEffect } from '@gglib/graphics'
import { Pipeline, PipelineContext, pipelineImporter, pipelinePreprocessor, pipelineProcessor } from '../Pipeline'

pipelineImporter(['.json', 'application/json'], 'Material[]', (context: PipelineContext): Promise<void> => {
  // parse text content into json
  context.imported = JSON.parse(context.downloaded.content)
  // materials can be defined as an array (a material collection) or as single material object
  // this importer explicitely imports a material collection: 'Material[]'
  // thus ensure that the intermediate object is an array
  if (!Array.isArray(context.imported)) {
    context.imported = [context.imported]
  }
  // send to the "Material[]" processor
  return context.pipeline.process(context)
})

pipelineProcessor('Material[]', (context: PipelineContext): Promise<void> => {
  if (!Array.isArray(context.imported)) {
    const err = new Error(`'context.imported' expected to be an array but was '${context.imported}'.`)
    return Promise.reject(err)
  }
  context.result = []
  // send each entry to the process stage individaully
  return Promise.all(context.imported.map((mtl: any, index: number) => {
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
      context.result[index] = subContext.result
    })
  })).then(() => {
    //
  })
})

pipelineImporter(['.json', 'application/json'], 'Material', (context: PipelineContext): Promise<void> => {
  // parse text content into json
  context.imported = JSON.parse(context.downloaded.content)
  // materials can be defined as an array (a material collection) or as single material object
  // this importer explicitely imports a 'Material' object
  // thus only the first material is taken into the process stage
  if (Array.isArray(context.imported)) {
    context.imported = context.imported[0]
  }
  // send to the "Material" processor
  return context.pipeline.process(context)
})

pipelineProcessor('Material', (context: PipelineContext) => {
  if (Array.isArray(context.imported)) {
    const err = new Error(`'context.imported' expected to be an object but was an array.`)
    return Promise.reject(err)
  }

  let json = context.imported
  // the material name
  let name = json.name
  // the effect url to load
  let effect = json.effect
  // the material parameters
  let params = json.parameters || {}

  // load the effect from effect path
  return context.manager.load(ShaderEffect, effect).then((loadedEffect) => {
    // TODO: allow the user of the pipeline to tell wheter to clone the effect or use the loaded reference
    context.result = loadedEffect.clone()
    // take the previous name an material parameters
    context.result.name = name
    context.result.parameters = extend(context.result.parameters || {}, params)
  })
})

pipelinePreprocessor('Material', (context: PipelineContext) => {
  if (!context.imported) {
    return Promise.reject('imported data is missing')
  }
  const data = context.imported
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
      let url = Uri.merge(context.source, value)
      let promise = context.manager.load('Texture2D', url)
      .then((texture) => {
        parameters[key] = texture
      })
      .catch((e) => {
        delete parameters[key]
        Log.w(`failed to load effect parameter texture (${key}:${value})`)
        Log.e(e)
      })
      promises.push(promise)
    }
  }
  return Promise.all(promises).then(() => undefined)
})

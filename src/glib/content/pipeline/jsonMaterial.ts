module Glib.Content.Pipeline {

  importer('.json', 'Material[]', function(context:Context):IPromise {
    // parse text content into json
    context.intermediate = JSON.parse(context.raw.content)
    // materials can be defined as an array (a material collection) or as single material object
    // this importer explicitely imports a material collection: 'Material[]'  
    // thus ensure that the intermediate object is an array
    if (!Array.isArray(context.intermediate)) {
      context.intermediate = [context.intermediate]
    }
    // send to the "Material[]" processor
    return context.manager.process(context)
  })

  processor('Material[]', function(context:Context) {
    context.result = []
    // send each entry to the process stage individaully
    return Promise.all(context.intermediate.map(function(mtl, index) {
      // prepare the new context
      let subContext = utils.extend({}, context, {
        intermediate: mtl,
        targetType: "Material"
      }) as Context
      // send to the "Material" processor
      return context.manager.process(subContext).then(function() {
        context.result[index] = subContext.result
      })
    }))
  })

  importer('.json', 'Material', function(context:Context):IPromise {
    // parse text content into json
    context.intermediate = JSON.parse(context.raw.content)
    // materials can be defined as an array (a material collection) or as single material object
    // this importer explicitely imports a 'Material' object
    // thus only the first material is taken into the process stage
    if (Array.isArray(context.intermediate)) {
      context.intermediate = context.intermediate[0]
    }
    // send to the "Material" processor
    return context.manager.process(context)
  })

  processor('Material', function(context:Context) {
    let json = context.intermediate
    // the material name
    let name = json.name
    // the effect url to load
    let effect = json.effect
    // the material parameters
    let params = json.parameters || {}

    // load the effect from effect path
    return context.manager.load('Effect', effect).then(function(effect) {
      // TODO: allow the user of the pipeline to tell wheter to clone the effect or use the loaded reference 
      context.result = effect.clone()
      // take the previous name an material parameters
      context.result.name = name
      context.result.parameters = utils.extend(context.result.parameters || {}, params)
    })
  })

  preprocessor('Material', function(context:Context) {

    let data = context.intermediate
    let parameters = data.parameters
    if (!parameters) return Promise.resolve()

    // Lookup each parameter. If it is a string, it is assumed to be a url to a texture.
    // Loads the textures and replaces the urls with the texture objects
    // TODO: how to detect 3d and cube texture parameters ?
    
    let promises = []
    for (let key in parameters) {
      let value = parameters[key]
      if (typeof value !== 'string') continue
      let url = utils.path.merge(context.path, value)
      let promise = context.manager.load('Texture2D', url)
      .then(function(texture) { 
        parameters[key] = texture
      })
      .catch(function() {
        delete parameters[key]
        utils.warn(`failed to load effect parameter texture (${key}:${value})`)
      }) 
      promises.push(promise)
    }
    return Promise.all(promises)
  })
}

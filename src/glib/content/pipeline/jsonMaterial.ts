module Glib.Content.Pipeline {

  importer('.json', 'Material', function(context:Context):IPromise {
    context.intermediate = JSON.parse(context.raw.content)
    if (Array.isArray(context.intermediate)) {
      context.intermediate = context.intermediate[0]
    }
    return context.manager.process(context)
  })

  processor('Material', function(context:Context) {
    return context.manager.load('Effect', context.intermediate.effect).then(function(effect) {
      context.result = effect.clone()
      context.result.parameters = utils.extend(context.result.parameters || {}, context.intermediate.parameters || {})
    })
  })

  preprocessor('Material', function(context:Context) {
    let data = context.intermediate
    let parameters = data.parameters
    let promises = []
    for (let i in parameters) {
      let key = i
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



  importer('.json', 'Material[]', function(context:Context):IPromise {
    context.intermediate = JSON.parse(context.raw.content)
    if (!Array.isArray(context.intermediate)) {
      context.intermediate = [context.intermediate]
    }
    return context.manager.process(context)
  })

  processor('Material[]', function(context:Context) {
    context.result = []
    return Promise.all(context.intermediate.map(function(mtl, index) {
      let subContext = utils.extend({}, context) as Context
      subContext.intermediate = mtl
      subContext.targetType = "Material"
      return context.manager.process(subContext).then(function() {
        context.result[index] = subContext.result
      })
    }))
  })
}

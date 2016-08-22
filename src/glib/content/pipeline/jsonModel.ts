module Glib.Content.Pipeline {

  importer('.json', 'Model', function(context:Context) {
    context.intermediate = JSON.parse(context.raw.content)
    return context.manager.process(context)
  })

  processor('Model', function(context:Context) {
    context.result = new Graphics.Model(context.manager.device, context.intermediate)
  })

  preprocessor('Model', function(context:Context) {
    let json = context.intermediate || {}
    let materials = json.material || json.materials
    if (!Array.isArray(materials)) materials = [materials]
    return Promise.all(materials.map(function(path) {
      return context.manager.load('Material[]', utils.path.merge(context.path, path)).then(function(mtl) {
        return mtl
      })
    })).then(function(materials) {
      json.materials = [].concat.apply([], materials)
      delete json.material
    })
  })
}

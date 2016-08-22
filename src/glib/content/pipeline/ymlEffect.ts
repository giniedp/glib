module Glib.Content.Pipeline {
  loader(['.yml', '.glfx'], 'Effect', function(context:Context):IPromise {
    return context.manager.download(context.path).then(function(res:RawAsset) {
      context.raw = res
      return context.manager.import(context)
    })
  })

  importer(['.yml', '.glfx'], 'Effect', function(context:Context):IPromise {
    context.intermediate = Parser.YML.parse(context.raw.content)
    return context.manager.process(context)
  })
}

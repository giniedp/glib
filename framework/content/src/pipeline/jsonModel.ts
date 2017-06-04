import { extend, path } from '@glib/core'
import { Model } from '@glib/graphics'
import { Context, importer, preprocessor, processor } from '../Pipeline'

importer('.json', 'Model', (context: Context) => {
  context.intermediate = JSON.parse(context.raw.content)
  return context.manager.process(context)
})

processor('Model', (context: Context) => {
  context.result = new Model(context.manager.device, context.intermediate)
})

preprocessor('Model', (context: Context) => {
  let json = context.intermediate || {}
  let materials = json.material || json.materials
  if (!Array.isArray(materials)) {
    materials = [materials]
  }
  return Promise.all(materials.map((mtl: any) => {
    if (typeof mtl === 'string') {
      return context.manager.load('Material[]', path.merge(context.path, mtl)).then((mtl) => mtl)
    } else {
      // prepare the new context
      let subContext = extend({}, context, {
        intermediate: mtl,
        targetType: 'Material',
      }) as Context
      // send to the "Material" processor
      return context.manager.process(subContext).then(() => {
        return subContext.result
      })
    }
  })).then((materials) => {
    json.materials = [].concat.apply([], materials)
    delete json.material
  })
})

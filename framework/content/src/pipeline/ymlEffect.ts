import { YML } from '../parser'
import { Context, importer, loader, preprocessor, processor } from '../Pipeline'
import { RawAsset } from './../Manager'

loader(['.yml', '.glfx'], 'Effect', (context: Context): Promise<void> => {
  return context.manager.download(context.path).then((res: RawAsset) => {
    context.raw = res
    return context.manager.import(context)
  })
})

importer(['.yml', '.glfx'], 'Effect', (context: Context): Promise<void> => {
  context.intermediate = YML.parse(context.raw.content)
  return context.manager.process(context)
})

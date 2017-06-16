import { PipelineContext, pipelineLoader } from '../Pipeline'

pipelineLoader(['.jpg', '.jpeg', '.png', '.bmp', 'image/jpg', 'image/png'], [Image, HTMLImageElement], (context: PipelineContext) => {
  let image = new Image()
  context.result = image

  return new Promise((resolve, reject) => {
    if (context.options.await) {
      image.onload = resolve
      image.onabort = reject
      image.src = context.source
    } else {
      image.src = context.source
      resolve()
    }
  }).then(() => undefined)
  // skips the 'importer' and 'processor' stages
})

import { PipelineContext, pipelineLoader, pipelineProcessor } from '../Pipeline'

pipelineLoader(['*'], [ImageData], (context: PipelineContext) => {
  return context.manager.load(Image, context.source, { await: true }).then((image) => {
    context.imported = image
    return Promise.resolve(context.pipeline.process(context))
  })
})

pipelineProcessor([ImageData], (context: PipelineContext) => {
  context.result = getImageData(context.imported)
})

let canvas: HTMLCanvasElement
let canvasContext2d: CanvasRenderingContext2D
function getImageData(image: HTMLImageElement, width?: number, height?: number): ImageData {
  if (!image.complete) {
    throw new Error('image must be completed')
  }
  canvas = canvas || document.createElement('canvas')
  canvas.width = width || image.naturalWidth
  canvas.height = height || image.naturalHeight

  canvasContext2d = canvasContext2d || canvas.getContext('2d')
  canvasContext2d.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvasContext2d.getImageData(0, 0, canvas.width, canvas.height)
}

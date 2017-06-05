import { Pipeline, PipelineContext, pipelineImporter, pipelineLoader, pipelinePreProcessor, pipelineProcessor } from '../Pipeline'

pipelineLoader('*', 'Texture', (context: PipelineContext) => {
  context.intermediate = { data: context.path }
  return context.pipeline.process(context) // skips the importer stage
})

pipelineProcessor('Texture', (context: PipelineContext) => {
  context.result = context.manager.device.createTexture(context.intermediate)
})

pipelineLoader('*', 'Texture2D', (context: PipelineContext) => {
  context.intermediate = { data: context.path }
  return context.pipeline.process(context) // skips the importer stage
})
pipelineProcessor('Texture2D', (context: PipelineContext) => {
  context.result = context.manager.device.createTexture2D(context.intermediate)
})

pipelineLoader('*', 'TextureCube', (context: PipelineContext) => {
  context.intermediate = { data: context.path }
  return context.pipeline.process(context) // skips the importer stage
})

pipelineProcessor('TextureCube', (context: PipelineContext) => {
  context.result = context.manager.device.createTextureCube(context.intermediate)
})

pipelineLoader('*', 'Image', (context: PipelineContext) => {
  let image = new Image()
  image.src = context.path
  context.result = image
  // skips the importer and processor stages
})
pipelineLoader('*', 'Video', (context: PipelineContext) => {
  let video = document.createElement('video')
  video.src = context.path
  context.result = video
  // skips the importer and processor stages
})

pipelineLoader('*', 'ImageData', (context: PipelineContext) => {
  return new Promise((resolve, reject) => {
    let image = new Image()
    image.onload = () => {
      context.intermediate = image
      resolve(context.pipeline.process(context))
    }
    image.onabort = (e) => { reject(e) }
    image.src = context.path
  }).then(() => undefined)
})

pipelineProcessor('ImageData', (context: PipelineContext) => {
  context.result = getImageData(context.intermediate)
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

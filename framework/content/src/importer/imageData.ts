import { Http, HttpOptions, Log } from '@glib/core'
import { PipelineContext, pipelineLoader, pipelineProcessor } from '../Pipeline'
import { TGA } from './../parser/TGA'

pipelineLoader(['.jpg', '.jpeg', '.png', '.bmp', 'image/jpg', 'image/png'], [ImageData, 'ImageData'], (context: PipelineContext) => {
  return context.manager.load(Image, context.source).then((image) => {
    context.imported = image
    return context.pipeline.process(context)
  })
})

pipelineLoader(['.tga', 'image/x-tga'], [ImageData, 'ImageData'], (context: PipelineContext) => {
  const ajax: HttpOptions = {
    xhr: Http.createXMLHttpRequest(),
    url: context.source,
  }
  ajax.xhr.responseType = 'arraybuffer'

  return context.manager.download(ajax).then((res) => {
    context.result = TGA.parse(res.content)
  })
})

pipelineProcessor([ImageData, 'ImageData'], (context: PipelineContext) => {
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

import { Context, importer, loader, preprocessor, processor } from '../Pipeline'

loader('*', 'Texture', (context: Context) => {
  context.intermediate = { data: context.path }
  return context.manager.process(context) // skips the importer stage
})

processor('Texture', (context: Context) => {
  context.result = context.manager.device.createTexture(context.intermediate)
})

loader('*', 'Texture2D', (context: Context) => {
  context.intermediate = { data: context.path }
  return context.manager.process(context) // skips the importer stage
})
processor('Texture2D', (context: Context) => {
  context.result = context.manager.device.createTexture2D(context.intermediate)
})

loader('*', 'TextureCube', (context: Context) => {
  context.intermediate = { data: context.path }
  return context.manager.process(context) // skips the importer stage
})

processor('TextureCube', (context: Context) => {
  context.result = context.manager.device.createTextureCube(context.intermediate)
})

loader('*', 'Image', (context: Context) => {
  let image = new Image()
  image.src = context.path
  context.result = image
  // skips the importer and processor stages
})
loader('*', 'Video', (context: Context) => {
  let video = document.createElement('video')
  video.src = context.path
  context.result = video
  // skips the importer and processor stages
})

loader('*', 'ImageData', (context: Context) => {
  return new Promise((resolve, reject) => {
    let image = new Image()
    image.onload = () => {
      context.intermediate = image
      resolve(context.manager.process(context))
    }
    image.onabort = (e) => { reject(e) }
    image.src = context.path
  }).then(() => undefined)
})

processor('ImageData', (context: Context) => {
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

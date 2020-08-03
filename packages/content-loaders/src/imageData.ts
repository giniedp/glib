import { loader } from '@gglib/content'

/**
 * @public
 */
export const loadJpegToImageData = loader({
  input: ['.jpg', '.jpeg', 'image/jpg'],
  output: ImageData,
  handle: async (_, context): Promise<ImageData> => {
    return context.manager.load(context.source, HTMLImageElement).then((image) => getImageData(image))
  },
})

/**
 * @public
 */
export const loadPngToImageData = loader({
  input: ['.png', 'image/png'],
  output: ImageData,
  handle: async (_, context): Promise<ImageData> => {
    return context.manager.load(context.source, HTMLImageElement).then((image) => getImageData(image))
  },
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

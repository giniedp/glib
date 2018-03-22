let canvas: HTMLCanvasElement = null

/**
 * @public
 */
export function getImageData(image: HTMLImageElement, width?: number, height?: number) {
  if (!image.complete) {
    throw new Error('image must be completed')
  }
  canvas = canvas || document.createElement('canvas')
  canvas.width = width || image.naturalWidth
  canvas.height = height || image.naturalHeight

  let ctx = canvas.getContext('2d')

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let data = imgData.data
  let result = []
  result.length = data.length / 4
  for (let i = 0; i < result.length; i += 1) {
    result[i] = data[i * 4]
  }
  return result
}

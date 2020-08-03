import { loader } from '@gglib/content'

/**
 * @public
 */
export const loadJpegToHTMLImageElement = loader({
  input: ['.jpg', '.jpeg', 'image/jpg'],
  output: HTMLImageElement,
  handle: (_, context): Promise<HTMLImageElement> => loadImage(context.source),
})

/**
 * @public
 */
export const loadJpegToImage = loader({
  input: ['.jpg', '.jpeg', 'image/jpg'],
  output: Image,
  handle: (_, context): Promise<HTMLImageElement> => loadImage(context.source),
})

/**
 * @public
 */
export const loadPngToHTMLImageElement = loader({
  input: ['.png', 'image/png'],
  output: HTMLImageElement,
  handle: (_, context): Promise<HTMLImageElement> => loadImage(context.source),
})

/**
 * @public
 */
export const loadPngToImage = loader({
  input: ['.png', 'image/png'],
  output: Image,
  handle: (_, context): Promise<HTMLImageElement> => loadImage(context.source),
})

async function loadImage(url: string) {
  const image = document.createElement('img')
  return new Promise((resolve, reject) => {
    image.onload = () => {
      image.onload = null
      image.onabort = null
      image.onerror = null
      resolve()
    }
    image.onabort = image.onerror = (err) => {
      image.onabort = image.onload = null
      reject(err)
    }
    image.src = url
  }).then(() => image)
}

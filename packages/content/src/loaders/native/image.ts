import { loader } from '../../utils'

export const jpegToHTMLImageElement = loader<null, HTMLImageElement>({
  input: ['.jpg', '.jpeg', 'image/jpg'],
  output: HTMLImageElement,
  handle: (_, context) => loadImage(context.source),
})

export const jpegToImage = loader<null, HTMLImageElement>({
  input: ['.jpg', '.jpeg', 'image/jpg'],
  output: Image,
  handle: (_, context) => loadImage(context.source),
})

export const pngToHTMLImageElement = loader<null, HTMLImageElement>({
  input: ['.png', 'image/png'],
  output: HTMLImageElement,
  handle: (_, context) => loadImage(context.source),
})

export const pngToImage = loader<null, HTMLImageElement>({
  input: ['.png', 'image/png'],
  output: Image,
  handle: (_, context) => loadImage(context.source),
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

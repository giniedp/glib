import { loader } from '@gglib/content'
import { TGA } from './format'

/**
 * Downloads an array buffer from source and parses with the TGA parser
 * @public
 */
export const loadTgaToImageData = loader({
  input: ['.tga', 'image/x-tga'],
  output: ImageData,
  handle: async (_, context) => {
    return context.manager.downloadArrayBuffer(context.source).then((res) => TGA.parse(res.content))
  },
})

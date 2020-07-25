import { TGA } from '../../formats/tga'
import { loader } from '../../utils'

/**
 * @public
 */
export const loadTgaToImageData = loader(
  ['.tga', 'image/x-tga'],
  ImageData,
  async (_, context) => {
    return context.manager.downloadArrayBuffer(context.source).then((res) => TGA.parse(res.content))
  },
)

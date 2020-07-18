
import { TGA } from '../../formats/tga'
import { loader } from '../../utils'

/**
 * @public
 */
export const loadTgaToImageData = loader({
  input: ['.tga', 'image/x-tga'],
  output: ImageData,
  handle: async (_, context): Promise<ImageData> => context.manager.downloadArrayBuffer(context.source).then((res) => TGA.parse(res.content)),
})

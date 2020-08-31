import { loader, Loader } from '@gglib/content'
import { TGA } from './format'
import { Texture, TextureOptions } from '@gglib/graphics'

/**
 * Downloads an array buffer from source and parses with the TGA parser
 * @public
 */
export const loadTgaToTGA: Loader<string, TGA> = loader({
  input: ['.tga', 'image/x-tga'],
  output: TGA,
  handle: async (_, context): Promise<TextureOptions> => {
    return context.manager.downloadArrayBuffer(context.source).then((res) => new TGA(res.content))
  },
})

/**
 * Converts a TGA image into Texture options
 * @public
 */
export const loadTgaToTexture2D: Loader<TGA, TextureOptions> = loader({
  input: TGA,
  output: Texture.Options,
  handle: async (tga: TGA): Promise<TextureOptions> => tga.getTextureOptions(),
})

/**
 * Reads ImageData (RGBA 32bit) from a TGA instance
 * @public
 */
export const loadTgaToImageData: Loader<TGA, ImageData> = loader({
  input: TGA,
  output: ImageData,
  handle: async (tga: TGA): Promise<ImageData> => tga.getImageData(),
})

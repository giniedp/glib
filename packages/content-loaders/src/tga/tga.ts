import { AssetContainer, AssetLoader, ContentLoader, loader, Loader, LoaderContext } from '@gglib/content'
import { createTextureSource, Texture, TextureOptions } from '@gglib/graphics'
import { TGA } from './format'

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

export class TGATextureLoader implements AssetLoader {
  public static readonly extensions = ['.tga']
  public static readonly mimeTypes = ['image/x-tga']
  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const options = new TGA(response.body).getTextureOptions()
    return {
      source: url,
      textures: [
        {
          ...options,
          source: createTextureSource(options.source, {
            width: options.width,
            height: options.height,
            type: options.pixelType,
          }),
        },
      ],
    }
  }
}

ContentLoader.register({
  extensions: TGATextureLoader.extensions,
  mimeTypes: TGATextureLoader.mimeTypes,
  loader: TGATextureLoader,
})

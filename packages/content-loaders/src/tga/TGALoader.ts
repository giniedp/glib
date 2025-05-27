import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { createTextureSource } from '@gglib/graphics'
import { TGA } from './format'

export class TGALoader implements AssetLoader {
  public static extensions = ['.tga']
  public static mimeTypes = ['image/x-tga']
  public static loader = TGALoader
  public static register() {
    ContentLoader.registerLoader(TGALoader)
  }

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

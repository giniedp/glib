import { AssetContainer, AssetLoader, ContentLoader, LoaderContext } from '@gglib/content'
import { createTextureSource, SamplerState } from '@gglib/graphics'
import { File } from './format'

export function registerLoader() {
  ContentLoader.registerLoader(Loader)
}

export class Loader implements AssetLoader {
  public static extensions = ['.tga']
  public static mimeTypes = ['image/x-tga']
  public static loader = Loader

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'arraybuffer',
    })
    const options = new File(response.body).getTextureOptions()
    return {
      source: url,
      textures: [
        {
          ...options,
          sampler: options.generateMipmap ? {...SamplerState.LinearWrap} : {...SamplerState.LinearClampNoMipMap},
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

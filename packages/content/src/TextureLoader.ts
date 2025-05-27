import { createTextureSource } from '@gglib/graphics'
import { AssetContainer } from './AssetContainer'
import { AssetLoader, ContentLoader, LoaderContext } from './ContentLoader'

export class TextureLoader implements AssetLoader {
  public static register() {
    ContentLoader.registerLoader({
      extensions: ['.jpg', '.jpeg', '.png', '.webp'],
      mimeTypes: ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'],
      loader: TextureLoader,
    })
  }

  public get supportsImageBitmap() {
    return typeof createImageBitmap === 'function'
  }

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    if (this.supportsImageBitmap) {
      return this.loadWithImageBitmap(url, context)
    }
    return this.loadWithimageElement(url, context)
  }

  protected async loadWithImageBitmap(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'blob',
      signal: context.signal,
    })
    const bitmap = await createImageBitmap(response.body)
    return {
      source: url,
      textures: [
        {
          source: createTextureSource(bitmap),
          width: bitmap.width,
          height: bitmap.height,
        },
      ],
    }
  }

  protected async loadWithimageElement(url: string, context: LoaderContext): Promise<AssetContainer> {
    const image = document.createElement('img')
    await new Promise((resolve, reject) => {
      image.onload = () => {
        image.onload = null
        image.onabort = null
        image.onerror = null
        resolve(void 0)
      }
      image.onabort = image.onerror = (err) => {
        image.onabort = image.onload = null
        reject(err)
      }
      image.src = url
    }).then(() => image)
    return {
      source: url,
      textures: [
        {
          source: createTextureSource(image),
          width: image.naturalWidth,
          height: image.naturalHeight,
        },
      ],
    }
  }
}

TextureLoader.register()

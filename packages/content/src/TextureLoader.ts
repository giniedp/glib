import { createTextureSource, SamplerState, TextureImageOptions } from '@gglib/graphics'
import { AssetContainer } from './AssetContainer'
import { AssetLoader, ContentLoader, LoaderContext } from './ContentLoader'

const supportsImageBitmap = typeof createImageBitmap === 'function'

export async function imageFromBlob(blob: Blob): Promise<TextureImageOptions> {
  if (!supportsImageBitmap) {
    return imageFromUrl(URL.createObjectURL(blob))
  }
  const bitmap = await createImageBitmap(blob, {
    imageOrientation: 'none',
    premultiplyAlpha: 'none',
    colorSpaceConversion: 'none',
  })
  return {
    source: createTextureSource(bitmap),
    width: bitmap.width,
    height: bitmap.height,
  }
}

export async function imageFromUrl(url: string): Promise<TextureImageOptions> {
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
    source: createTextureSource(image),
    width: image.naturalWidth,
    height: image.naturalHeight,
  }
}

export class TextureLoader implements AssetLoader {
  public static extensions = ['.jpg', '.jpeg', '.png', '.webp']
  public static mimeTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']
  public static loader = TextureLoader
  public static register() {
    ContentLoader.registerLoader(TextureLoader)
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
    const options = await imageFromBlob(response.body)
    return {
      source: url,
      textures: [
        {
          ...options,
          generateMipmap: true,
          sampler: SamplerState.LinearWrap,
        },
      ],
    }
  }

  protected async loadWithimageElement(url: string, context: LoaderContext): Promise<AssetContainer> {
    const options = await imageFromUrl(url)
    return {
      source: url,
      textures: [
        {
          ...options,
          generateMipmap: true,
          sampler: SamplerState.LinearWrap,
        },
      ],
    }
  }
}

TextureLoader.register()

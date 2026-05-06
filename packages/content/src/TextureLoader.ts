import { AcquireTextureOptions, createTextureSource, TextureOptions } from '@gglib/graphics'
import { AssetContainer, TextureAssetContainer } from './AssetContainer'
import { AssetLoader } from './AssetLoaderRegistry'
import { ContentLoader, LoaderContext } from './ContentLoader'

const supportsImageBitmap = typeof createImageBitmap === 'function'

export async function imageFromBlob(blob: Blob): Promise<TextureOptions> {
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

export async function imageFromUrl(url: string): Promise<AcquireTextureOptions> {
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
    key: url,
    source: createTextureSource(image),
    type: 'Texture2D',
    width: image.naturalWidth,
    height: image.naturalHeight,
    generateMipmap: true,
  }
}

export class TextureLoader implements AssetLoader {
  public static extensions = ['.jpg', '.jpeg', '.png', '.webp']
  public static mimeTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']
  public static create = () => new TextureLoader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(TextureLoader)
  }

  public get supportsImageBitmap() {
    return typeof createImageBitmap === 'function'
  }

  public async load(url: string, context: LoaderContext): Promise<AssetContainer> {
    if (this.supportsImageBitmap) {
      return this.loadWithImageBitmap(url, context)
    }
    return this.loadWithImageElement(url, context)
  }

  protected async loadWithImageBitmap(url: string, context: LoaderContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'blob',
      signal: context.signal,
    })
    const options = await imageFromBlob(response.body)
    const texture: AcquireTextureOptions = {
      key: url,
      ...options,
    }
    return new TextureAssetContainer([texture])
  }

  protected async loadWithImageElement(url: string, context: LoaderContext): Promise<AssetContainer> {
    const options = await imageFromUrl(url)
    return new TextureAssetContainer([
      {
        ...options,
        generateMipmap: true,
      },
    ])
  }
}

TextureLoader.register()

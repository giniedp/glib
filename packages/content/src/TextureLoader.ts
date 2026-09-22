import { AcquireTextureOptions, createImageBitmapOptions, createTextureSource, Texture } from '@gglib/graphics'
import { AssetContainer, TextureAssetContainer } from './AssetContainer'
import { AssetLoader } from './AssetLoaderRegistry'
import { ContentLoader, LoadContext } from './ContentLoader'

export class TextureLoader implements AssetLoader {
  public static extensions = ['.bmp', '.gif', '.jpg', '.jpeg', '.png', '.webp']
  public static mimeTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp']
  public static create = () => new TextureLoader()
  public static register(registry = ContentLoader.loaders) {
    registry.register(TextureLoader)
  }

  public get supportsImageBitmap() {
    return typeof createImageBitmap === 'function'
  }

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    context.signal?.throwIfAborted()
    if (this.supportsImageBitmap) {
      return this.loadWithImageBitmap(url, context)
    }
    return this.loadWithImageElement(url, context)
  }

  protected async loadWithImageBitmap(url: string, context: LoadContext): Promise<AssetContainer> {
    const response = await context.content.fetch(url, {
      responseType: 'blob',
      signal: context.signal,
    })
    context.signal?.throwIfAborted()

    const bitmap = await createImageBitmap(response.body, createImageBitmapOptions())
    context.signal?.throwIfAborted()

    const texture: AcquireTextureOptions = {
      key: url,
      type: '2d',
      source: createTextureSource(bitmap),
      width: bitmap.width,
      height: bitmap.height,
      generateMipmap: true,
      format: context.color === 'srgb' ? 'rgba8unorm-srgb' : 'rgba8unorm',
    }

    return new TextureAssetContainer([texture])
  }

  protected async loadWithImageElement(url: string, context: LoadContext): Promise<AssetContainer> {
    const image = new Image()
    image.crossOrigin = context?.crossOrigin ?? Texture.crossOrigin
    image.src = url
    await image.decode()
    context.signal?.throwIfAborted()

    const texture: AcquireTextureOptions = {
      key: url,
      type: '2d',
      source: createTextureSource(image),
      width: image.naturalWidth,
      height: image.naturalHeight,
      generateMipmap: true,
      format: context.color === 'srgb' ? 'rgba8unorm-srgb' : 'rgba8unorm',
    }

    return new TextureAssetContainer([texture])
  }
}

TextureLoader.register()

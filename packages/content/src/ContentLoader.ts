import {
  AnimationData,
  Device,
  MaterialOptions,
  MeshOptions,
  Model,
  ModelSkin,
  Texture,
  TextureOptions,
} from '@gglib/graphics'
import { Type, Uri } from '@gglib/utils'
import { HttpClient, HttpOptions, HttpResponse } from './HttpClient'

/**
 * An asset container holding loaded data ready to create graphics resources.
 *
 * @remarks
 * Modeled after glTF 2.0 asset container.
 */
export interface AssetContainer {
  /**
   * The url where this asset was loaded from.
   */
  source: string

  cameras?: any[]

  textures?: TextureOptions[]

  materials?: MaterialOptions[]

  meshes?: MeshOptions[]

  animations?: AnimationData[]

  skins?: ModelSkin[]

  roots?: number[]
}

export interface LoadOptions {
  /**
   * The base URL to be prepended to the request URL.
   */
  baseUrl?: string

  /**
   * The loader to use for this request. If not provided,
   * the loader will be determined based on the URL and registered loaders.
   */
  loader?: AssetLoader

  /**
   * The type hint of the asset to load. Can be a file extension or a MIME type.
   *
   * @remarks
   * Useful if the type cannot be determined from the URL
   */
  type?: string

  /**
   * Abort signal to cancel the load request.
   */
  signal?: AbortSignal

  [key: string]: any
}

export interface ContentLoaderOptions {
  loaders?: RegisteredLoader[]
}

export class ContentLoader {
  /**
   * The registered loaders
   */
  public static loaders: RegisteredLoader[] = []

  /**
   * Registers a new loader
   */
  public static register(loader: RegisteredLoader): void {
    if (!ContentLoader.loaders) {
      ContentLoader.loaders = []
    }
    ContentLoader.loaders.push(loader)
  }

  /**
   * The instance of the graphics device
   */
  public device: Device

  /**
   * The instance of the HTTP client used to fetch resources
   */
  public http = new HttpClient()

  /**
   * Registered loaders that take precedence over the static `ContentLoader.loaders`
   */
  public loaders: RegisteredLoader[] = []

  /**
   * Resolves a request uri relative to the resource uir
   */
  public resolveUrl(resourceUri: string, requestUri: string) {
    return Uri.merge(resourceUri, requestUri)
  }

  public constructor(device: Device, options?: ContentLoaderOptions) {
    this.device = device
    if (options?.loaders) {
      this.loaders = options.loaders
    }
  }

  public async fetch(url: string, options: HttpOptions<'blob'>): Promise<HttpResponse<Blob>>
  public async fetch(url: string, options: HttpOptions<'arraybuffer'>): Promise<HttpResponse<ArrayBuffer>>
  public async fetch<T = any>(url: string, options: HttpOptions<'json'>): Promise<HttpResponse<T>>
  public async fetch(url: string, options: HttpOptions<'text'>): Promise<HttpResponse<string>>
  public async fetch(url: string, options: HttpOptions<any>): Promise<unknown> {
    return this.http.fetch(url, options)
  }

  public async load(url: string, options?: LoadOptions): Promise<AssetContainer> {
    url = this.resolveUrl(options?.baseUrl || '', url)
    const loader = await this.getLoaderInstance(url, options)
    if (!loader) {
      throw new Error(`No loader found for URL: ${url}`)
    }
    return loader.load(url, {
      ...(options || {}),
      content: this,
    })
  }

  public async loadTexture(url: string, options?: LoadOptions): Promise<Texture> {
    const asset = await this.load(url, options)
    const input = asset.textures?.[0]
    if (!input) {
      throw new Error(`No texture found in asset loaded from: ${url}`)
    }
    if (!input.source) {
      throw new Error(`Texture source is missing in asset loaded from: ${url}`)
    }
    return this.device.createTexture(asset.textures[0])
  }

  public async loadModel(url: string, options?: LoadOptions): Promise<Model> {
    const asset = await this.load(url, options)
    return new Model(this.device, asset)
  }

  protected async getLoaderInstance(url: string, options?: LoadOptions): Promise<AssetLoader> {
    if (options?.loader) {
      return options.loader
    }
    let type: Type<AssetLoader> = null
    if (options?.type) {
      type = this.findLoaderType(options.type)
    }
    if (!type) {
      const ext = Uri.ext(url).toLowerCase()
      type = this.findLoaderType(ext)
    }
    if (!type) {
      const res = await this.http.fetch(url, { method: 'HEAD' })
      type = this.findLoaderType(res.contentType)
    }
    if (type) {
      return new type()
    }
    throw new Error(`No loader found for URL: ${url} with type: ${options?.type || 'unknown'}`)
  }

  protected findLoaderType(type: string) {
    if (!type) {
      return null
    }
    for (const loader of this.loaders) {
      if (loader.extensions.includes(type) || loader.mimeTypes.includes(type)) {
        return loader.loader
      }
    }
    for (const loader of ContentLoader.loaders) {
      if (loader.extensions.includes(type) || loader.mimeTypes.includes(type)) {
        return loader.loader
      }
    }
    return null
  }
}

export interface RegisteredLoader {
  extensions: string[]
  mimeTypes: string[]
  loader: Type<AssetLoader>
}

export interface AssetLoader {
  load(url: string, context: LoaderContext): Promise<AssetContainer>
}

export interface LoaderContext extends LoadOptions {
  /**
   * The content loader instance that initiated the load request
   */
  content: ContentLoader
}

import {
  Device,
  isAquirableTextureOptions,
  Material,
  MaterialEffectOptions,
  MaterialOptions,
  Texture,
  TextureOptions,
} from '@gglib/graphics'
import { Model, ModelOptions } from '@gglib/model'
import { extname, mergeUri } from '@gglib/utils'
import { AssetContainer } from './AssetContainer'
import { AssetLoader, AssetLoaderRegistry, LoaderByExtension, LoaderEntry, LoaderFactory } from './AssetLoaderRegistry'
import { AsyncExecutor, NaiveAsyncExecutor } from './AsyncExecutor'
import { HttpClient, HttpOptions, HttpResponse } from './HttpClient'
import { MaterialFactory, MaterialMatcher, MaterialRegistry, MaterialType } from './MaterialRegistry'

export interface LoaderContext {
  /**
   * The content loader instance that initiated the load request
   */
  content: ContentLoader

  /**
   * The base URL to resolve asset URLs against.
   */
  baseUrl?: string

  /**
   * Abort signal to cancel the load request.
   */
  signal?: AbortSignal
}

export type LoadOptions = Omit<LoaderContext, 'content'> & {
  /**
   * The type hint of the asset to load. Can be a file extension or a MIME type.
   *
   * @remarks
   * Useful if the type cannot be determined from the URL
   */
  type?: string
}

export type TransformLoadOptions<T, R> = LoadOptions & {
  /**
   * Optional function to transform the loaded asset
   */
  transform: (data: T) => R
}

export interface ContentLoaderOptions {
  http?: HttpClient
  executor?: AsyncExecutor
  registry?: AssetLoaderRegistry
}

export class ContentLoader {
  /**
   * Registry for loader types
   */
  public static loaders = new AssetLoaderRegistry()

  /**
   * Registers a loader type
   */
  public static registerLoader(descriptor: LoaderEntry | LoaderByExtension): void {
    this.loaders.register(descriptor)
  }

  /**
   * Registry for material types
   */
  public static materials = new MaterialRegistry()

  /**
   * Registers a material type
   */
  public static registerMaterial(type: MaterialType, match: MaterialMatcher): void
  public static registerMaterial(spec: MaterialFactory): void
  public static registerMaterial(spec: MaterialFactory | MaterialType, match?: MaterialMatcher): void {
    this.materials.register(spec as any, match)
  }

  /**
   * The graphics device instance
   */
  public device: Device

  /**
   * The http client instance
   */
  public http: HttpClient

  /**
   * Loader registry that take precedence over the static {@link ContentLoader.loaders}
   */
  public registry: AssetLoaderRegistry

  /**
   * Async executor used exclusively for leaf I/O tasks.
   *
   * @remarks
   * Default implementation is {@link NaiveAsyncExecutor}, which executes all tasks immediately
   * without concurrency limiting.
   *
   * This executor is intended only for *leaf-level operations*, such as:
   * - network requests
   * - texture decoding / uploading
   * - GPU upload operations
   *
   * Orchestration tasks (e.g. model loading, material composition, dependency resolution)
   * must NOT be executed through this executor otherwise it can introduce deadlocks due to
   * nested dependency chains.
   */
  public executor: AsyncExecutor

  /**
   * Registers a loader type
   */
  public registerLoader(descriptor: LoaderEntry | LoaderByExtension): void {
    this.registry.register(descriptor)
  }

  /**
   * Material registry that take precedence over the static {@link ContentLoader.materials}
   */
  public materials = new MaterialRegistry()

  /**
   * Registers a material type
   */
  public registerMaterial(type: MaterialType, match: MaterialMatcher): void
  public registerMaterial(spec: MaterialFactory): void
  public registerMaterial(spec: MaterialFactory | MaterialType, match?: MaterialMatcher): void {
    this.materials.register(spec as any, match)
  }

  /**
   * Resolves a request uri relative to the resource uri
   */
  public resolveUrl(requestUri: string, assetUri: string, baseUri?: string) {
    if (baseUri) {
      return mergeUri('', requestUri, baseUri)
    }
    return mergeUri(assetUri || '', requestUri)
  }

  /**
   * Indicates whether the loaded assets should be cached per URL
   */
  public cache = true

  protected assetCache: Map<string, Promise<AssetContainer>> = new Map()

  public constructor(device: Device, options?: ContentLoaderOptions) {
    this.device = device
    this.http = options?.http || new HttpClient()
    this.registry = options?.registry || new AssetLoaderRegistry()
    this.executor = options?.executor || new NaiveAsyncExecutor()
  }

  public async fetch(url: string, options: HttpOptions<'blob'>): Promise<HttpResponse<Blob>>
  public async fetch(url: string, options: HttpOptions<'arraybuffer'>): Promise<HttpResponse<ArrayBuffer>>
  public async fetch<T = any>(url: string, options: HttpOptions<'json'>): Promise<HttpResponse<T>>
  public async fetch(url: string, options: HttpOptions<'text'>): Promise<HttpResponse<string>>
  public async fetch(url: string, options: HttpOptions<any>): Promise<unknown> {
    return this.executor.run(() => this.http.fetch(url, options), options?.signal)
  }

  /**
   * Loads an asset container from the given URL
   */
  public async load(url: string, options?: LoadOptions): Promise<AssetContainer> {
    url = this.resolveUrl(url, options?.baseUrl)

    if (this.cache && this.assetCache.has(url)) {
      return this.assetCache.get(url)
    }

    const context = this.createContext(options)
    const promise = this.resolveLoader(url, options?.type).then((loader) => {
      if (!loader) {
        throw new Error(`No loader found for URL: ${url}`)
      }

      return loader.load(url, context)
    })

    if (this.cache) {
      this.assetCache.set(url, promise)
    }

    return promise
  }

  public async loadTexture(url: string, options?: LoadOptions): Promise<Texture>
  public async loadTexture<R>(url: string, options?: TransformLoadOptions<TextureOptions, R>): Promise<R>
  public async loadTexture<R>(url: string, options?: TransformLoadOptions<TextureOptions, R>): Promise<R> {
    const container = await this.load(url, options)
    const data = await container.loadTexture(0, this.createContext(options))
    if (options?.transform) {
      return options?.transform(data)
    }
    return this.transformTexture(data) as R
  }
  public async loadMaterial(url: string, options?: LoadOptions): Promise<Material>
  public async loadMaterial<T extends Material = Material>(url: string, options?: LoadOptions): Promise<T>
  public async loadMaterial(url: string, options?: LoadOptions): Promise<Material> {
    const container = await this.load(url, options)
    const data = await container.loadMaterial(0, this.createContext(options))
    return this.createMaterial(data)
  }

  public async loadModel(url: string, options?: LoadOptions): Promise<Model>
  public async loadModel<R>(url: string, options?: TransformLoadOptions<ModelOptions, R>): Promise<R>
  public async loadModel<R>(url: string, options?: TransformLoadOptions<ModelOptions, R>): Promise<R> {
    const container = await this.load(url, options)
    const data = await container.loadModel(0, this.createContext(options))
    if (options?.transform) {
      return options?.transform(data)
    }
    return this.transformModel(data) as R
  }

  public transformModel = (data: ModelOptions): Model => {
    data = { ...data }
    data.meshes = data.meshes.map((mesh) => {
      mesh = { ...mesh }
      mesh.materials = mesh.materials.map((it) => {
        return this.createMaterial(it)
      })
      return mesh
    })
    return new Model(this.device, data)
  }

  public createMaterial(options: Material | MaterialEffectOptions | MaterialOptions): Material {
    if (!options) {
      throw new Error('Material options are required')
    }
    if (options instanceof Material) {
      return options
    }
    if ('effect' in options) {
      return new Material(null as any, options)
    }

    const entry = this.findMaterial(options)
    if (entry) {
      return entry.create(this.device, options)
    }
    if (options.factory) {
      return options.factory(this.device, options)
    }
    throw new Error(`No material type found for asset: ${options.name || 'unknown'}`)
  }

  public transformTexture = (data: TextureOptions): Texture => {
    if (isAquirableTextureOptions(data)) {
      return this.device.acquireTexture(data)
    }
    return this.device.createTexture(data)
  }
  /**
   * Creates a loader for the given URL
   *
   * @remarks
   * If no loader can be determined from the URL or options,
   * it will perform a HEAD request to the URL to determine the content type.
   */
  public async resolveLoader(url: string, type?: string): Promise<AssetLoader> {
    let factory: LoaderFactory = null

    if (type) {
      factory = this.findLoader(type)
    }

    if (!factory) {
      const ext = extname(url).toLowerCase()
      factory = this.findLoader(ext)
    }

    if (!factory) {
      const res = await this.http.fetch(url, { method: 'HEAD' }).catch((err) => {
        // ignore as it's just unable to determine the content type
        // failed request is visible in the network tab
      })
      if (res) {
        factory = this.findLoader(res.contentType)
      }
    }

    if (factory) {
      return await factory(this)
    }

    throw new Error(`No loader found for URL: ${url} with type: ${type || 'unknown'}`)
  }

  public createContext(options?: LoadOptions | TransformLoadOptions<any, any>): LoaderContext {
    const result = {
      ...(options || {}),
      content: this,
    }
    delete (result as any as TransformLoadOptions<any, any>).transform
    return result
  }

  protected findLoader(type: string) {
    if (!type) {
      return null
    }
    return this.registry.find(type) || ContentLoader.loaders.find(type)
  }

  protected findMaterial(asset: MaterialOptions) {
    if (!asset) {
      return null
    }
    return this.materials.find(asset) || ContentLoader.materials.find(asset)
  }
}

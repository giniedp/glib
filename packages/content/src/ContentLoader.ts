import {
  BasicMaterial,
  Device,
  isAquirableTextureOptions,
  isOwnable,
  Material,
  Mesh,
  MaterialOptions,
  ResourceScope,
  Texture,
  TextureOptions,
} from '@gglib/graphics'
import { Model, ModelOptions } from '@gglib/model'
import { extname, mergeUri } from '@gglib/utils'
import { AssetContainer } from './AssetContainer'
import { AssetLoader, AssetLoaderRegistry, LoaderByExtension, LoaderEntry, LoaderFactory } from './AssetLoaderRegistry'
import { AssetType } from './AssetType'
import { AsyncExecutor, NaiveAsyncExecutor } from './AsyncExecutor'
import { HttpClient, HttpOptions, HttpResponse } from './HttpClient'

export interface LoadContext {
  /**
   * The content loader instance that started the load request.
   */
  content: ContentLoader

  /**
   * The base URL to use to resolve asset URLs.
   */
  baseUrl?: string

  /**
   * Abort signal to cancel the load request.
   */
  signal?: AbortSignal

  /**
   * The type hint for the asset to load. This can be a file extension or a MIME type.
   *
   * @remarks
   * Use this if the type cannot be found from the URL.
   */
  type?: string

  /**
   * The intended color space for the currently loaded texture.
   *
   * @remarks
   * This tells the loader which color space to use for the currently loaded texture.
   *
   * Some loaders may ignore this.
   */
  color?: ColorSpace

  /**
   *
   */
  crossOrigin?: string
}

export type ColorSpace = 'srgb' | 'linear'
export type LoadOptions = Omit<LoadContext, 'content'> & {
  /**
   * Index of the asset in the container, default is 0
   *
   * @remarks
   * Only used by {@link ContentLoader.load}, it is not passed on to the load context.
   */
  index?: number

  /**
   * The scope that should own the loaded instance
   *
   * @remarks
   * Only used by {@link ContentLoader.load}, it is not passed on to the load context.
   * Loading the same asset in multiple scopes returns the same instance, owned by all of them.
   * Once the instance is finalized, it is removed from the cache and the next load creates a new one.
   */
  scope?: ResourceScope | null
}
export type AssetCreator<Options = any, Instance = any> = (content: ContentLoader, options: Options) => Instance

/**
 * Returns the key under which {@link ContentLoader.load} caches an asset
 */
export type AssetCacheKey = (type: AssetType<any, any>, url: string, options?: LoadOptions) => string

/**
 * The default {@link AssetCacheKey}: the url, and the asset index if it is not 0
 */
export const defaultAssetCacheKey: AssetCacheKey = (_type, url, options) => {
  return options?.index ? `${url}#${options.index}` : url
}

export interface ResolveUriOptions {
  /**
   * The asset whose content references the URI (e.g. the .gltf referencing a texture), if any.
   *
   * @remarks
   * Acts like the document URL of an HTML page: relative URIs resolve against its directory,
   * unless a {@link ResolveUriOptions.baseUri} is given.
   */
  parentUri?: string
  /**
   * Acts like the `<base href>` of an HTML page.
   *
   * @remarks
   * When set, relative URIs resolve against it instead of the {@link ResolveUriOptions.parentUri}.
   * Like `<base href>`, it resolves against its directory (`/foo/` vs `/foo`), root-absolute URIs
   * keep only its origin, and a relative base itself resolves against the `parentUri`.
   */
  baseUri?: string
}

/**
 * Resolves an asset URI to the URL that is loaded
 */
export type UriResolver = (assetUri: string, options: ResolveUriOptions) => string

/**
 * The default {@link UriResolver}: resolves `assetUri` like a browser resolves a link,
 * with `parentUri` as the document URL and `baseUri` as its `<base href>`
 */
export const defaultUriResolver: UriResolver = (assetUri, { parentUri, baseUri }) => {
  let base = parentUri || ''
  if (baseUri) {
    const isDirectory = baseUri.endsWith('/')
    base = mergeUri(base, baseUri)
    // mergeUri drops the trailing slash, but it decides which directory the base points to
    if (isDirectory && !base.endsWith('/')) {
      base += '/'
    }
  }
  return mergeUri(base, assetUri)
}

export interface ContentLoaderOptions {
  http?: HttpClient
  executor?: AsyncExecutor
  registry?: AssetLoaderRegistry
  disableCache?: boolean
  /**
   * Custom cache key for assets, e.g. to share assets with the same content across urls.
   * Default is {@link defaultAssetCacheKey}
   */
  cacheKey?: AssetCacheKey
  /**
   * Custom URI resolver, e.g. to rewrite or redirect asset URLs.
   * Default is {@link defaultUriResolver}
   */
  resolveUri?: UriResolver
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
  public loaders: AssetLoaderRegistry

  /**
   * Async executor used only for leaf I/O tasks.
   *
   * @remarks
   * The default implementation is {@link NaiveAsyncExecutor}.
   * It runs all tasks immediately and does not limit concurrency.
   *
   * Use this executor only for leaf-level operations like
   * - network requests
   * - texture decoding or uploading
   * - GPU upload operations
   *
   * Do NOT use this executor for orchestration tasks like
   * - model loading
   * - material composition
   * - dependency resolution
   *
   * because nested dependency chains can cause deadlocks.
   */
  public executor: AsyncExecutor

  /**
   * Registers a loader type
   */
  public registerLoader(descriptor: LoaderEntry | LoaderByExtension): void {
    this.loaders.register(descriptor)
  }

  /**
   * Asset creator registry
   */
  public creators = new Map<string, AssetCreator<any, any>>()

  /**
   * Registeres a creator function
   */
  public registerCreator<O, T>(type: AssetType<O, T>, factory: AssetCreator<O, T>) {
    this.creators.set(type, factory)
  }

  /**
   * The URI resolver used by {@link ContentLoader.resolveUri}
   *
   * @remarks
   * Replace or wrap it to customize how asset URIs are resolved.
   * Default is {@link defaultUriResolver}
   */
  public uriResolver: UriResolver

  /**
   * Resolves an asset URI to the URL that is loaded
   */
  public resolveUri(assetUri: string, options?: ResolveUriOptions): string {
    return this.uriResolver(assetUri, options || {})
  }

  protected disableCache = false
  protected containerCache: Map<string, Promise<AssetContainer>> = new Map()
  protected assetCache: Map<string, Map<string, Promise<any>>> = new Map()
  protected cacheKey: AssetCacheKey

  public constructor(device: Device, options?: ContentLoaderOptions) {
    this.device = device
    this.http = options?.http || new HttpClient()
    this.loaders = options?.registry || new AssetLoaderRegistry()
    this.executor = options?.executor || new NaiveAsyncExecutor()
    this.disableCache = !!options?.disableCache
    this.cacheKey = options?.cacheKey || defaultAssetCacheKey
    this.uriResolver = options?.resolveUri || defaultUriResolver
  }

  public async fetch(url: string, options: HttpOptions<'blob'>): Promise<HttpResponse<Blob>>
  public async fetch(url: string, options: HttpOptions<'arraybuffer'>): Promise<HttpResponse<ArrayBuffer>>
  public async fetch<T = any>(url: string, options: HttpOptions<'json'>): Promise<HttpResponse<T>>
  public async fetch(url: string, options: HttpOptions<'text'>): Promise<HttpResponse<string>>
  public async fetch(url: string, options: HttpOptions<any>): Promise<unknown> {
    return this.executor.run(() => this.http.fetch(url, options), options?.signal)
  }

  /**
   * Loads an asset container from the given URL.
   *
   * @remarks
   * Loads asset data from URL. Uses the `url` as cache key.
   * First caller always populates the cache. Repeating calls with
   * different `options.type` don't change the result.
   */
  public async loadContainer(url: string, options?: LoadOptions): Promise<AssetContainer> {
    url = this.resolveUri(url, { baseUri: options?.baseUrl })

    if (!this.disableCache && this.containerCache.has(url)) {
      return this.containerCache.get(url)
    }

    const promise = this.resolveLoader(url, options?.type).then((loader) => {
      if (!loader) {
        throw new Error(`No loader found for URL: ${url}`)
      }

      return loader.load(url, {
        ...(options || {}),
        content: this,
      })
    })

    if (!this.disableCache) {
      this.containerCache.set(url, promise)
    }

    return promise
  }

  /**
   * Loads an asset from the container at the given URL and creates an instance.
   *
   * @remarks
   * Loads the asset at `options.index` (default 0) of the container. The instance is cached,
   * the key is given by the `cacheKey` option of the loader (url and index by default).
   * Repeating calls with the same key return the same instance.
   */
  public async load<T>(type: AssetType<any, T>, url: string, options?: LoadOptions): Promise<T> {
    if (!this.assetCache.has(type)) {
      this.assetCache.set(type, new Map())
    }

    const { index, scope, ...context } = options || {}
    const cache = this.assetCache.get(type)
    const key = this.cacheKey(type, url, options)
    if (!this.disableCache && cache.has(key)) {
      return cache.get(key).then((instance) => ownInstance(instance, scope))
    }

    const promise = this.loadContainer(url, context)
      .then((container): Promise<T> => {
        return container.load(type, index ?? 0, {
          ...context,
          content: this,
        })
      })
      .then((options) => {
        const instance = this.create(type, options)
        if (!this.disableCache && isOwnable(instance)) {
          instance.owners.onFinalize(() => {
            if (cache.get(key) === promise) {
              cache.delete(key)
            }
          })
        }
        return instance
      })

    if (!this.disableCache) {
      cache.set(key, promise)
    }

    return promise.then((instance) => ownInstance(instance, scope))
  }

  /**
   * Creates a new asset instance.
   *
   * @remarks
   *
   */
  public create<O, T>(type: AssetType<O, T>, options: O): T {
    const factory = this.findCreator(type)
    if (!factory) {
      throw new Error(`Factory not found for asset type: ${type}`)
    }
    return factory(this, options)
  }

  /**
   * Shorthand for `load(AssetType.Texture, options)`
   */
  public async loadTexture(url: string, options?: LoadOptions): Promise<Texture> {
    return this.load(AssetType.Texture, url, options)
  }

  /**
   * Shorthand for `load(AssetType.Material, options)`
   */
  public async loadMaterial(url: string, options?: LoadOptions): Promise<Material> {
    return this.load(AssetType.Material, url, options)
  }

  /**
   * Shorthand for `load(AssetType.Model, options)`
   */
  public async loadModel(url: string, options?: LoadOptions): Promise<Model> {
    return this.load(AssetType.Model, url, options)
  }

  /**
   * Shorthand for `create(AssetType.Model, options)`
   */
  public createModel = (data: ModelOptions): Model => {
    return this.create(AssetType.Model, data)
  }

  /**
   * Shorthand for `create(AssetType.Material, options)`
   */
  public createMaterial = (options: Material | MaterialOptions): Material => {
    return this.create(AssetType.Material, options)
  }

  /**
   * Shorthand for `create(AssetType.Texture, options)`
   */
  public createTexture = (options: TextureOptions): Texture => {
    return this.create(AssetType.Texture, options)
  }

  /**
   * Creates a loader for the given URL.
   *
   * @remarks
   * If no loader can be found from the URL or options, this method sends
   * a HEAD request to the URL. The method then uses the returned content type to try again.
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

  protected findLoader(type: string) {
    if (!type) {
      return null
    }
    return this.loaders.find(type) || ContentLoader.loaders.find(type)
  }

  protected findCreator(type: AssetType): AssetCreator {
    if (this.creators.has(type)) {
      return this.creators.get(type)
    }
    switch (type) {
      case AssetType.Material: {
        return createMaterial
      }
      case AssetType.Texture: {
        return createTexture
      }
      case AssetType.Model: {
        return createModel
      }
    }
    return null
  }
}

export const createModel: AssetCreator<ModelOptions, Model> = (content: ContentLoader, data: ModelOptions): Model => {
  return new Model(content.device, {
    ...data,
    meshes: data.meshes?.map((mesh) => {
      if (mesh instanceof Mesh) {
        return mesh
      }
      return {
        ...mesh,
        // meshes create (and own) their materials, routed through the creator registry of the content loader
        materials: mesh.materials?.map((it) => {
          if (it instanceof Material) {
            return it
          }
          // the wrapper replaces `factory` on the copy only, `it` keeps its original factory, so this does not recurse
          return { ...it, factory: () => content.create(AssetType.Material, it) }
        }),
      }
    }),
  })
}

function ownInstance<T>(instance: T, scope: ResourceScope | null | undefined): T {
  if (scope && isOwnable(instance)) {
    scope.own(instance)
  }
  return instance
}

export const createMaterial: AssetCreator<MaterialOptions, Material> = (
  content: ContentLoader,
  options: Material | MaterialOptions,
): Material => {
  if (!options) {
    throw new Error('Material options are required')
  }
  if (options instanceof Material) {
    return options
  }
  if (options.effect) {
    return new Material(null as any, options)
  }
  if (options.factory) {
    return options.factory(content.device, options)
  }
  return new BasicMaterial(content.device, options)
}

export function createTexture(content: ContentLoader, options: TextureOptions): Texture {
  if (isAquirableTextureOptions(options)) {
    return content.device.acquireTexture(options)
  }
  return content.device.createTexture(options)
}

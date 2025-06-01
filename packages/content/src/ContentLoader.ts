import { Device, Material, MaterialOptions, Texture, TextureOptions } from '@gglib/graphics'
import { Model } from '@gglib/model'
import { Uri } from '@gglib/utils'
import { AssetContainer } from './AssetContainer'
import { HttpClient, HttpOptions, HttpResponse } from './HttpClient'
import { AssetLoader, LoaderType, LoaderTypeDescriptor, LoaderTypeRegistry } from './LoaderTypeRegistry'
import { MaterialType, MaterialTypeDescriptor, MaterialTypeRegistry } from './MaterialTypeRegistry'

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

export class ContentLoader {
  /**
   * Registry for loader types
   */
  public static loaders = new LoaderTypeRegistry()

  /**
   * Registers a loader type
   */
  public static registerLoader(descriptor: LoaderTypeDescriptor): void {
    this.loaders.register(descriptor)
  }

  /**
   * Registry for material types
   */
  public static materials = new MaterialTypeRegistry()

  /**
   * Registers a material type
   */
  public static registerMaterial(descriptor: MaterialTypeDescriptor): void {
    this.materials.register(descriptor)
  }

  /**
   * The graphics device instance
   */
  public device: Device

  /**
   * The http client instance
   */
  public http = new HttpClient()

  /**
   * Loader registry that take precedence over the static {@link ContentLoader.loaders}
   */
  public loaders = new LoaderTypeRegistry()

  /**
   * Registers a loader type
   */
  public registerLoader(descriptor: LoaderTypeDescriptor): void {
    this.loaders.register(descriptor)
  }

  /**
   * Material registry that take precedence over the static {@link ContentLoader.materials}
   */
  public materials = new MaterialTypeRegistry()

  /**
   * Registers a material type
   */
  public registerMaterial(descriptor: MaterialTypeDescriptor): void {
    this.materials.register(descriptor)
  }

  /**
   * Resolves a request uri relative to the resource uri
   */
  public resolveUrl(requestUri: string, resourceUri: string, context?: LoaderContext) {
    return Uri.merge(resourceUri, requestUri)
  }

  /**
   * Indicates whether the loaded assets should be cached per URL
   */
  public cache = true

  protected assetCache: Map<string, AssetContainer> = new Map()

  public constructor(device: Device) {
    this.device = device
  }

  public async fetch(url: string, options: HttpOptions<'blob'>): Promise<HttpResponse<Blob>>
  public async fetch(url: string, options: HttpOptions<'arraybuffer'>): Promise<HttpResponse<ArrayBuffer>>
  public async fetch<T = any>(url: string, options: HttpOptions<'json'>): Promise<HttpResponse<T>>
  public async fetch(url: string, options: HttpOptions<'text'>): Promise<HttpResponse<string>>
  public async fetch(url: string, options: HttpOptions<any>): Promise<unknown> {
    return this.http.fetch(url, options)
  }

  public async loadAsset(url: string, options?: LoadOptions): Promise<AssetContainer> {
    url = this.resolveUrl(url, options?.baseUrl || '')

    if (this.cache && this.assetCache.has(url)) {
      return this.assetCache.get(url)
    }

    const loader = await this.createLoader(url, options)
    if (!loader) {
      throw new Error(`No loader found for URL: ${url}`)
    }

    const request = loader.load(url, {
      ...(options || {}),
      assetUrl: url,
      content: this,
    })

    if (this.cache) {
      request.then((asset) => {
        this.assetCache.set(url, asset)
      })
    }
    return request
  }

  /**
   * Loads the asset from the given URL and creates a texture from the first texture entry
   */
  public async loadTexture(url: string, options?: LoadOptions): Promise<Texture> {
    const asset = await this.loadAsset(url, options)
    const input = asset.textures?.[0]
    if (!input) {
      throw new Error(`No texture found in asset loaded from: ${url}`)
    }
    return this.device.createTexture(asset.textures[0])
  }

  /**
   * Loads the asset from the given URL and assembles a model instance
   */
  public async loadModel(url: string, options?: LoadOptions): Promise<Model> {
    const asset = await this.loadAsset(url, options)
    return this.createModel(asset)
  }

  /**
   * Loads the asset from the given URL and creates a material from the first material entry
   */
  public async loadMaterial(url: string, options?: LoadOptions): Promise<Material> {
    const asset = await this.loadAsset(url, options)
    if (!asset.materials?.length) {
      throw new Error(`No materials found in asset loaded from: ${url}`)
    }
    return this.createMaterial(asset.materials[0])
  }

  public createTexture(options: TextureOptions): Texture {
    return this.device.createTexture(options)
  }

  /**
   * Creates a material from given options
   *
   * @remarks
   * This detects the material type based on the `effectName` property in the options.
   * If the `effectName` is not provided, it defaults to the base `Material` type.
   * In this case the options must contain a technique and source code for the shader.
   */
  public createMaterial(options: MaterialOptions): Material {
    let type: MaterialType = Material

    if ('effectName' in options) {
      const descriptor = this.findMaterialDescriptor(options.effectName)
      if (!descriptor || !descriptor.type) {
        if (options.effectName === 'BasicEffect') {
          // special case, will fallback to a minimalistic shader
        } else {
          throw new Error(`No material type found for effect: ${options.effectName}`)
        }
      } else {
        type = descriptor.type
        if (descriptor.convert) {
          options = descriptor.convert(options)
        }
        return new type(this.device, options)
      }
    }

    return new type(this.device, options)
  }

  /**
   * Creates a model from the given asset container
   */
  public createModel(options: AssetContainer): Model {
    const meshes = (options.meshes || []).map((mesh) => {
      mesh = { ...mesh }
      mesh.materials = (mesh.materials || []).map((options) => {
        return this.createMaterial(options)
      })
      return mesh
    })
    return new Model(this.device, {
      meshes,
      name: options.name,
      nodes: options.nodes,
      scene: options.scene,
      scenes: options.scenes,
      skins: options.skins,
      animations: options.animations,
    })
  }

  /**
   * Creates a loader for the given URL
   *
   * @remarks
   * If no loader can be determined from the URL or options,
   * it will perform a HEAD request to the URL to determine the content type.
   */
  public async createLoader(url: string, options?: LoadOptions): Promise<AssetLoader> {
    if (options?.loader) {
      return options.loader
    }
    let Loader: LoaderType = null
    if (options?.type) {
      Loader = this.findLoaderType(options.type)
    }
    if (!Loader) {
      const ext = Uri.ext(url).toLowerCase()
      Loader = this.findLoaderType(ext)
    }
    if (!Loader) {
      const res = await this.http.fetch(url, { method: 'HEAD' })
      Loader = this.findLoaderType(res.contentType)
    }
    if (Loader) {
      return new Loader(this)
    }
    throw new Error(`No loader found for URL: ${url} with type: ${options?.type || 'unknown'}`)
  }

  protected findLoaderType(type: string) {
    if (!type) {
      return null
    }
    return this.loaders.findLoaderType(type) || ContentLoader.loaders.findLoaderType(type)
  }

  protected findMaterialDescriptor(effectName: string) {
    if (!effectName) {
      return null
    }
    return this.materials.findDescriptor(effectName) || ContentLoader.materials.findDescriptor(effectName)
  }
}

export interface LoaderContext extends LoadOptions {
  /**
   * URL of the asset being loaded
   */
  assetUrl: string

  /**
   * The content loader instance that initiated the load request
   */
  content: ContentLoader
}
export { AssetLoader }

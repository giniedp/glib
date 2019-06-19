import { Device } from '@gglib/graphics'
import { DataUri, Http, HttpOptions, Log, Type, Uri } from '@gglib/utils'
import { ContentType } from './ContentType'
import { Data, dataFromElement, dataFromXhr } from './Data'
import { Pipeline } from './Pipeline'

/**
 * @public
 */
export interface IManagerOptions {
  enableDomAssets?: boolean
  loader?: Pipeline
}

function getOption<T>(options: IManagerOptions, key: keyof IManagerOptions, fallback: T): T {
  if (key in options) {
    return options[key] as any
  }
  return fallback
}

/**
 * @public
 */
export class Manager {
  /**
   * The instance of the graphics device
   */
  public device: Device

  /**
   * Allows to rewrite a url
   *
   * @remarks
   * Use this to remap a resource uri to another location.
   */
  public rewriteUrl: (url: string) => string = (it) => it

  /**
   * Allows to rewrite an http request
   *
   * @remarks
   * Use this to add authentication or header fields to the request.
   * Avoid changing the `url` string.
   */
  public rewriteRequest: (options: HttpOptions) => HttpOptions = (it: HttpOptions) => it

  /**
   * Encodes a string to an array buffer
   */
  public encode: (str: string) => ArrayBuffer = (str) => {
    const buf = new ArrayBuffer(str.length * 2)
    const bufView = new Uint8Array(buf)
    for (let i = 0; i < str.length; i++) {
      bufView[i] = str.charCodeAt(i)
    }
    return buf
  }

  /**
   * Indicates whether assets embedded in DOM elements are anabled
   */
  public enableDomAssets = true

  /**
   * The instance of the loader to use
   */
  public loader: Pipeline = Pipeline.default

  /**
   * Collection of all loaded assets
   */
  private loaded = new Map<string, any>()
  /**
   * Collection of all ongoing loading promises
   */
  private loading = new Map<string, Promise<any>>()

  /**
   * Collection of existing download requests
   */
  private downloads = new Map<string, Map<string, Promise<Data<any>>>>()

  /**
   *
   */
  constructor(device: Device, options: IManagerOptions= {}) {
    this.device = device
    this.enableDomAssets = getOption(options, 'enableDomAssets', this.enableDomAssets)
    this.loader = getOption(options, 'loader', this.loader)
  }

  /**
   * Downloads a resource as json
   */
  public async downloadJSON(optionsOrUrl: HttpOptions|string): Promise<Data<{}>> {
    const options = this.createHttpOptions(optionsOrUrl)
    options.xhr = Http.createXMLHttpRequest('json')
    return this.download<{}>(options)
  }

  /**
   * Downloads a resource as xml document
   */
  public async downloadDocument(optionsOrUrl: HttpOptions|string): Promise<Data<Document>> {
    const options = this.createHttpOptions(optionsOrUrl)
    options.xhr = Http.createXMLHttpRequest('document')
    return this.download<Document>(options)
  }

  /**
   * Downloads a resource as text
   */
  public async downloadText(optionsOrUrl: HttpOptions|string): Promise<Data<string>> {
    const options = this.createHttpOptions(optionsOrUrl)
    options.xhr = Http.createXMLHttpRequest('text')
    return this.download<string>(options)
  }

  /**
   * Downloads a resource as `Blob`
   */
  public async downloadBlob(optionsOrUrl: HttpOptions|string): Promise<Data<Blob>> {
    const options = this.createHttpOptions(optionsOrUrl)
    options.xhr = Http.createXMLHttpRequest('blob')
    return this.download<Blob>(options)
  }

  /**
   * Downloads a resource as `ArrayBuffer`
   */
  public async downloadArrayBuffer(optionsOrUrl: HttpOptions|string): Promise<Data<ArrayBuffer>> {
    const options = this.createHttpOptions(optionsOrUrl)
    options.xhr = Http.createXMLHttpRequest('arraybuffer')
    return this.download<ArrayBuffer>(options)
  }

  /**
   * Downloads data from a remote location.
   *
   * @remarks
   * If dom assets are enabled then an attempt will be made to find a DOM Element matching the following criteria
   *  - element has a `type` attribute
   *  - element has an `id` attribute with the value of the given url
   *
   * If such DOM Element exists then its textContent is taken as a result
   */
  public async download<T = any>(optionsOrUrl: HttpOptions|string): Promise<Data<T>> {
    let options = this.createHttpOptions(optionsOrUrl)
    if (this.rewriteRequest) {
      options = this.rewriteRequest(options) || options
    }
    const path = options.url
    const type = options.xhr ? options.xhr.responseType || 'text' : 'text'

    if (this.downloads.has(type)) {
      if (this.downloads.get(type).has(path)) {
        return this.downloads.get(type).get(path)
      }
    } else {
      this.downloads.set(type, new Map())
    }

    return this.downloads
      .get(type)
      .set(path, (async () => {
        if (this.enableDomAssets) {
          const element = document.getElementById(path) || document.getElementById(path.replace(/^[\/|#]/, ''))
          if (!element || !element.hasAttribute('type')) {
            //
          } else if (type === 'text') {
            return Promise.resolve(dataFromElement(path, element))
          } else if (type === 'json') {
            return Promise.resolve(dataFromElement(path, element, (text) => JSON.parse(text)))
          } else if (type === 'arraybuffer') {
            return Promise.resolve(dataFromElement(path, element, this.encode))
          } else {
            //
          }
        }
        if (this.enableDomAssets && type === 'text') {
          const element = document.getElementById(path) || document.getElementById(path.replace(/^[\/|#]/, ''))
          if (element && element.hasAttribute('type')) {
            return Promise.resolve(dataFromElement(path, element))
          }
        }
        return Http.request(options).then(dataFromXhr)
      })())
      .get(path)
  }

  /**
   * Loads and instantiates multiple assets
   *
   * @remarks
   * The given batch must be an object where each key identifies the target type e.g. `Model` or `Effect` etc.
   * The result has always the same structure as the given batch but all asset paths are replaced with an asset instance.
   *
   * If the batch value is a string, then that is used as an asset path where the asset is downloaded from.
   *
   *    ```
   *    load({ Model: 'path/to/model.obj' })
   *    // => { Model: INSTANCE }
   *    ```
   *
   * If the batch value is an array, then each entry is used as an asset path.
   *
   *    ```
   *    load({ Model: ['path/1.obj', 'path/2.obj'] })
   *    // => { Model: [INSTANCE1, INSTANCE2] }
   *    ```
   *
   * If the batch value is an object, then each entry is used as an asset path.
   *
   *    ```
   *    load({ Model: { foo: 'path/foo.obj' })
   *    // => { Model: { foo: INSTANCE } }
   *    ```
   *
   */
  public loadBatch(batch: { [key: string]: [string, any] }): Promise<{ [key: string]: any }> {
    let result = {}

    const promises: Array<Promise<any>> = []
    let counter = 0

    function enqueue(job: Promise<void>) {
      promises.push(job.then(() => {
        counter++
        // TODO: notify
      }))
    }

    Object.keys(batch).forEach((key) => {
      const [source, targetType] = batch[key]

      enqueue(this.load(source, targetType).then((res) => {
        result[key] = res
      }))
    })

    return Promise.all(promises).then(() => result)
  }

  /**
   * Checks whether loading from given source is supported.
   *
   * @param src The source url to load from. This will be passed to `rewriteUrl`.
   * @param targetType The target asset type or a symbol identifying the target type.
   */
  public canLoad<T = any>(src: string, targetType: symbol | Type<T>) {
    const remapped = this.rewriteUrl(src)
    if (remapped) {
      src = remapped
    }

    if (DataUri.isDataUri(src)) {
      return this.loader.canLoad(ContentType.parse(DataUri.parse(src).contentType).mimeType, targetType)
    } else {
      return this.loader.canLoad(Uri.ext(src), targetType)
    }
  }

  /**
   * Loads and instantiates a single asset
   *
   * @param src The source url to load from. This will be passed to `rewriteUrl`.
   * @param targetType The target asset type or a symbol identifying the target type.
   * @param options Options which will be available in the loading context.
   */
  public async load<T = any>(src: string, targetType: symbol | Type<T>, options: { [key: string]: any } = {}): Promise<T> {
    const requested = Uri.merge(location.href, src)
    const remapped = this.rewriteUrl(requested)
    if (requested !== remapped) {
      Log.i(`[Content.Manager] remap Url ${src} => ${remapped}`)
      src = remapped
    } else {
      src = requested
    }

    let key: string
    if (DataUri.isDataUri(src)) {
      const uri = DataUri.parse(src)
      const source = ContentType.parse(uri.contentType).mimeType
      const target = targetType['name'] || targetType.toString()
      key = `${source} => ${target}`
      Log.i(`[Content.Manager] load ${key} (from DataUri '${uri.contentType}')`)
    } else {
      const source = src
      const target = targetType['name'] || targetType.toString()
      key = `${source} => ${target}`
      Log.i(`[Content.Manager] load ${key}`)
    }

    if (this.loading.has(key)) {
      return this.loading.get(key)
    }

    if (this.loaded.has(key)) {
      return Promise.resolve(this.loaded.get(key))
    }

    return this.loading.set(key, Pipeline.run({
      manager: this,
      source: src,
      target: targetType,
      options: options,
      pipeline: this.loader,
    })).get(key).then((result) => {
      this.loading.delete(key)
      this.loaded.set(key, result)
      return result
    })
  }

  /**
   * Unloads all currently loaded assets
   */
  public unload() {
    this.loaded.forEach((value, key) => {
      try {
        if (typeof value.unload === 'function') { value.unload() }
      } catch (e) {
        Log.w(`[Content.Manager] failed to unload asset at '${key}'`, e)
      }
    })
    this.loaded.clear()
    this.loading.clear()
    // TODO: abort ongoing xhr requests
    this.downloads.forEach((v) => v.clear())
    this.downloads.clear()
  }

  private createHttpOptions(optionsOrUrl: HttpOptions|string): HttpOptions {
    let options = optionsOrUrl as HttpOptions
    if (typeof optionsOrUrl === 'string') {
      options = { url: optionsOrUrl }
    }
    return options
  }
}

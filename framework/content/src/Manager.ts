// tslint:disable ban-types
// tslint:disable max-classes-per-file

import { DataUri, extend, Http, HttpOptions, isArray, isObject, isString, Log, pick, Uri } from '@glib/core'
import { Device } from '@glib/graphics'
import { ContentType } from './ContentType'
import { Pipeline, PipelineContext, PipelineHandler } from './Pipeline'

export interface RawAsset {
  /**
   * The source url
   */
  source: string
  /**
   * The content
   */
  content: string
  /**
   * The content type (e.g. application/json)
   */
  contentType?: ContentType
}

export class XhrAsset implements RawAsset  {

  public get source(): string {
    return this.xhr.responseURL
  }

  public get content(): string {
    return this.xhr.responseText
  }

  public get contentTYpe(): string {
    return this.xhr.getResponseHeader('content-typ')
  }

  constructor(private xhr: XMLHttpRequest) {

  }
}

export class DataUriAsset implements RawAsset {

  public get source(): string {
    return this.uri.uri
  }

  public get content(): string {
    return this.uri.data
  }

  public get contentTYpe(): string {
    return this.uri.contentType
  }

  constructor(private uri: DataUri) {

  }
}

/**
 *
 */
export interface IManagerOptions {
  cacheEnabled?: boolean
  staticEnabled?: boolean
  defaultAjaxOptions?: any
  pipeline?: Pipeline
}

/**
 *
 */
export class Manager {
  /**
   *
   */
  public device: Device
  /**
   *
   */
  public loaded = {}
  /**
   *
   */
  public cached = {}
  /**
   *
   */
  public cacheEnabled = true
  /**
   *
   */
  public defaultAjaxOptions = {}
  /**
   *
   */
  public transformAjaxOptions = (it: any) => it
  /**
   *
   */
  public pipeline: Pipeline = new Pipeline()
  /**
   *
   */
  constructor(device: Device, options: IManagerOptions= {}) {
    this.device = device
    extend(this, pick(options, 'cacheEnabled', 'defaultAjaxOptions', 'transformAjaxOptions', 'pipeline'))
  }

  /**
   *
   */
  public lookup(path: string): RawAsset {
    if (this.cacheEnabled) {
      let found = this.cached[path]
      if (found) {
        return found
      }
    }
    if (DataUri.isDataUri(path)) {
      return new DataUriAsset(DataUri.parse(path))
    }
    return this.lookupInDOM(path)
  }

  /**
   *
   */
  public lookupInDOM(path: string): RawAsset {
    let element = document.getElementById(path)
    if (!element && path[0] === '/') {
      element = document.getElementById(path.substr(1))
    }
    return element ? {
      source: path,
      contentType: ContentType.parse(element.getAttribute('type')),
      content: element.textContent,
    } : null
  }

  /**
   *
   */
  public cache(data: RawAsset): RawAsset {
    if (this.cacheEnabled) {
      this.cache[data.source] = data
    }
    return data
  }

  /**
   *
   */
  public makeAjaxOptions(optionsOrUrl: HttpOptions|string): HttpOptions {
    let options = optionsOrUrl as HttpOptions
    if (typeof optionsOrUrl === 'string') {
      options = { url: optionsOrUrl }
    }
    options = extend({}, this.defaultAjaxOptions, options) as HttpOptions
    if (this.transformAjaxOptions) { this.transformAjaxOptions(options) }
    return options
  }

  public dataUriToAsset(uri: string): RawAsset {
    const parsed = DataUri.parse(uri)
    return {
      source: parsed.uri,
      contentType: ContentType.parse(parsed.contentType),
      content: parsed.data,
    }
  }

  /**
   *
   */
  public download(optionsOrUrl: HttpOptions|string): Promise<RawAsset> {
    const options = this.makeAjaxOptions(optionsOrUrl)
    return Promise.resolve(this.lookup(options.url)).then((result) => {
      return result || Http.request(options)
    }).then((result) => {
      this.cache(result)
      return result
    })
  }

  /**
   * Loads and instantiates multiple assets
   */
  public loadAssets(config: any): Promise<any> {
    let manager = this
    let result = {}

    let promises = []
    for (let key in config) {
      if (!config.hasOwnProperty(key)) { continue }
      const type = key
      const value = config[type]
      if (isString(value)) {
        promises.push(manager.load(type, value).then((res: any) => { result[key] = res }))
      } else if (isArray(value)) {
        let arr: any[] = result[key] = []
        for (let path of value) {
          promises.push(manager.load(type, path).then((res: any) => { arr.push(res) }))
        }
      } else if (isObject(value)) {
        let obj = result[key] = {}
        for (let k in value) {
          if (!value.hasOwnProperty(k)) { continue }
          promises.push(manager.load(type, value[k]).then((res: any) => { obj[k] = res }))
        }
      } else {
        throw new Error('invalid configuration')
      }
    }

    return Promise.all(promises).then(() => result)
  }

  /**
   * Loads and instantiates an assets
   */
  public load<T = any>(
    targetType: string|{ new (...arg: any[]): T },
    assetPath: string,
    options: { [key: string]: any } = {},
  ): Promise<T> {

    const sourceType = DataUri.isDataUri(assetPath)
      ? ContentType.parse(DataUri.parse(assetPath).contentType).mimeType
      : Uri.ext(assetPath)

    Log.d(`[Content.Manager] load ${targetType['name'] || targetType}, ${assetPath}, ${sourceType}`)

    // see if the asset is already loaded
    let key = (targetType['name'] || targetType) + ':' + assetPath
    let loaded = this.loaded[key]
    if (loaded) {
      return loaded
    }

    let context: PipelineContext = {
      source: assetPath,
      stage: 'load',
      manager: this,
      pipeline: this.pipeline,
      sourceType: sourceType,
      targetType: targetType,
      options: options,
    }

    return this.loaded[key] = this.pipeline.load(context).then(() => context.result)
  }

  /**
   * Unloads all currently loaded assets
   */
  public unload() {
    let keys = Object.keys(this.loaded)
    for (let key of keys) {
      let obj = this.loaded[key]
      delete this.loaded[key]
      try {
        if (typeof obj.unload === 'function') { obj.unload() }
      } catch (e) {
        Log.w(`[Content.Manager] failed to unload asset at '${key}'`, e)
      }
    }
  }
}

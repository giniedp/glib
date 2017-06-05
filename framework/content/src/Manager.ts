import { ajax, AjaxOptions, extend, isArray, isObject, isString, logger, path, pick } from '@glib/core'
import { Device } from '@glib/graphics'
import { Pipeline, PipelineContext, PipelineHandler } from './Pipeline'

export interface RawAsset {
  /**
   * The source path
   */
  path: string
  /**
   * The content
   */
  content: any
  /**
   * The content type (e.g. application/json)
   */
  contentType?: string
  /**
   * The original http request
   */
  xhr?: XMLHttpRequest
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
      if (found) { return found }
    }
    return null
  }

  /**
   *
   */
  public lookupInDOM(path: string): RawAsset {
    let element = document.getElementById(path)
    if (!element && path[0] === '/') { element = document.getElementById(path.substr(1)) }
    if (!element) { return }
    return {
      path: path,
      contentType: element.getAttribute('type'),
      content: element.textContent,
    }
  }

  /**
   *
   */
  public cache(data: RawAsset): RawAsset {
    if (this.cacheEnabled) {
      this.cache[data.path] = data
    }
    return data
  }

  /**
   *
   */
  public makeAjaxOptions(optionsOrUrl: AjaxOptions|string): AjaxOptions {
    let options = optionsOrUrl as AjaxOptions
    if (typeof optionsOrUrl === 'string') {
      options = { url: optionsOrUrl }
    }
    options = extend({}, this.defaultAjaxOptions, options) as AjaxOptions
    if (this.transformAjaxOptions) { this.transformAjaxOptions(options) }
    return options
  }

  /**
   *
   */
  public xhrToAssetData(requestOptions: AjaxOptions, xhr: XMLHttpRequest): RawAsset {
    return {
      path: requestOptions.url,
      contentType: xhr.getResponseHeader('content-type'),
      content: xhr.responseText,
      xhr: xhr,
    }
  }

  /**
   *
   */
  public download(optionsOrUrl: AjaxOptions|string): Promise<any> {
    let options = this.makeAjaxOptions(optionsOrUrl)

    // lookup for cached or statuc content
    let result = this.lookup(options.url)
    if (result) { return Promise.resolve(result) }

    result = this.lookupInDOM(options.url)
    if (result) { return Promise.resolve(result).then(this.cache.bind(this)) }

    // debug('[Manager] download', options)
    return ajax(options).then((xhr) => {
      return this.xhrToAssetData(options, xhr)
    }).then(this.cache.bind(this))
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
  public load<T = any>(targetType: string, assetPath: string, sourceType: string= path.ext(assetPath)): Promise<T> {
    logger.debug(`[Content.Manager] load ${targetType}, ${assetPath}, ${sourceType}`)

    // see if the asset is already loaded
    let key = targetType + ':' + assetPath
    let loaded = this.loaded[key]
    if (loaded) {
      return loaded
    }

    let context: PipelineContext = {
      path: assetPath,
      stage: 'load',
      manager: this,
      pipeline: this.pipeline,
      sourceType: sourceType,
      targetType: targetType,
      options: {},
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
        logger.warn(`[Content.Manager] failed to unload asset at '${key}'`, e)
      }
    }
  }
}

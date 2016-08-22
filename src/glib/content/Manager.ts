module Glib.Content {

  export interface RawAsset {
    /**
     * The source path
     */
    path:string
    /**
     * The content
     */
    content:any
    /**
     * The content type (e.g. application/json)
     */
    contentType?:string
    /**
     * The original http request
     */
    xhr?:XMLHttpRequest
  }

  /**
   * 
   */
  export interface IManagerOptions {
    cacheEnabled?: boolean
    staticEnabled?: boolean
    defaultAjaxOptions?: any
  }

  import debug = Glib.utils.debug

  /**
   * 
   */
  export class Manager {
    /**
     * 
     */
    device:Glib.Graphics.Device
    /**
     * 
     */
    loaded = {}
    /**
     * 
     */
    cached = {}
    /**
     * 
     */
    cacheEnabled = true
    /**
     * 
     */
    defaultAjaxOptions = {}
    /**
     * 
     */
    transformAjaxOptions = function(o) { return o }

    /**
     * 
     */
    constructor(device:Glib.Graphics.Device, options:IManagerOptions={}) {
      this.device = device
      utils.extend(this, utils.pick(options, "cacheEnabled", "defaultAjaxOptions", "transformAjaxOptions"))
    }

    /**
     * 
     */
    lookup(path:string):RawAsset {
      if (this.cacheEnabled) {
        let found = this.cached[path]
        if (found) return found
      }
      return null
    }

    /**
     * 
     */
    lookupInDOM(path:string):RawAsset {
      let element = document.getElementById(path)
      if (!element && path[0] === '/') element = document.getElementById(path.substr(1))
      if (!element) return
      return {
        path: path,
        contentType: element.getAttribute('type'),
        content: element.textContent
      }
    }

    /**
     * 
     */
    cache(data: RawAsset):RawAsset {
      if (this.cacheEnabled) this.cache[data.path] = data
      return data
    }

    /**
     * 
     */
    makeAjaxOptions(optionsOrUrl:utils.AjaxOptions|string):utils.AjaxOptions {
      let options = optionsOrUrl as utils.AjaxOptions
      if (typeof optionsOrUrl === "string") {
        options = { url: optionsOrUrl }
      }
      options = utils.extend({}, this.defaultAjaxOptions, options) as utils.AjaxOptions
      if (this.transformAjaxOptions) this.transformAjaxOptions(options)
      return options
    }

    /**
     * 
     */
    xhrToAssetData(requestOptions:utils.AjaxOptions, xhr:XMLHttpRequest):RawAsset {
      return {
        path: requestOptions.url,
        contentType: xhr.getResponseHeader('content-type'),
        content: xhr.responseText,
        xhr: xhr
      }      
    }

    /**
     * 
     */
    download(optionsOrUrl:utils.AjaxOptions|string):IPromise {
      let options = this.makeAjaxOptions(optionsOrUrl)

      // lookup for cached or statuc content
      let result = this.lookup(options.url) 
      if (result) return Promise.resolve(result)

      result = this.lookupInDOM(options.url)
      if (result) return Promise.resolve(result).then(this.cache.bind(this))

      // debug('[Manager] download', options)
      // fetch
      return utils.ajax(options)
      .then((xhr) => {
        return this.xhrToAssetData(options, xhr)
      })
      // cache
      .then(this.cache.bind(this))
    }

    /**
     * Loads and instantiates multiple assets
     */
    loadAssets(config: any): IPromise {
      let manager = this
      let result = {};
      
      let promises = [];
      for (let key in config){
        let type = key
        let value = config[type]
        if (typeof value === 'string') {
          promises.push(manager.load(type, value).then(function(res) { result[key] = res }))
        } else if (Array.isArray(value)) {
          let arr = result[key] = []
          for (let path of value) {
            promises.push(manager.load(type, path).then(function(res) { arr.push(res) }))
          }
        } else if (Glib.utils.isObject(value)) {
          let obj = result[key] = {}
          for (let k in value) {
            promises.push(manager.load(type, value[k]).then(function(res) { obj[k] = res }))
          }
        } else {
          throw "invalid configuration"
        }
      }

      return Glib.Promise.all(promises).then(function() {
        return result
      })
    }

    /**
     * Loads and instantiates an assets
     */
    load(targetType:string, path:string, sourceType:string=utils.path.ext(path)):IPromise {
      debug(`[Content.Manager] load ${targetType}, ${path}, ${sourceType}`)

      // see if the asset is already loaded
      let key = targetType + ':' + path
      let loaded = this.loaded[key]
      if (loaded) return loaded

      let context:Pipeline.Context = {
        path: path,
        stage: 'load',
        manager: this,
        sourceType: sourceType,
        targetType: targetType,
        options: {}
      }

      return this.loaded[key] = this
      .runHandlers('preload', context)
      .then(function() {
        let loader = Pipeline.getLoader(context.sourceType, context.targetType)
        if (!loader) return Promise.reject(`[Content.Manager] loader not found for sourceType:'${sourceType}' targetType:'${targetType}'`)
        return loader(context)
      })
      .then(function() {
        return context.result
      })
    }
    /**
     * 
     */
    import(context:Pipeline.Context):IPromise {
      context.stage = 'import'
      let importer = Pipeline.getImporter(context.sourceType, context.targetType)
      if (!importer) return Promise.reject(`[Content.Manager] importer not found for sourceType:'${context.sourceType}' targetType:'${context.targetType}'`)
      return Promise.resolve(importer(context))
    }
    /**
     * 
     */
    process(context:Pipeline.Context):IPromise {
      return this
      .runHandlers('preprocess', context)
      .then(() => {
        context.stage = 'process'
        let processor = Pipeline.getProcessor(context.targetType)
        if (!processor) return Promise.reject(`[Content.Manager] processor not found for targetType:'${context.targetType}'`)
        return Promise.resolve(processor(context))
      })
      .then(() => {
        this.runHandlers('postprocess', context)
      })
    }
    private runHandlers(name:string, context:Pipeline.Context):IPromise {
      context.stage = name as any
      let handlers = Pipeline.getHandlers(context.stage, null, context.targetType)
      return Promise.all(handlers.map(function(it) {
        return it(context)
      }))
    }

    /**
     * Unloads all currently loaded assets
     */
    unload() {
      let keys = Object.keys(this.loaded)
      for (let key of keys) {
        let obj = this.loaded[key]
        delete this.loaded[key]
        try {
          if (typeof obj.unload === 'function') obj.unload()
        } catch (e) {
          utils.warn(`[Content.Manager] failed to unload asset at '${key}'`, e)
        }
      }
    }
  }
}

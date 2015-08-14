module Glib.Content {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;
  import extend = Glib.utils.extend;
  import ajax = Glib.utils.ajax;

  function normalizeUrl(url, baseUrl?:string) {
    return utils.path.merge(baseUrl || window.location.origin, url);
  }

  function cacheAssetResponse(xhr){
    var url = normalizeUrl(xhr.responseURL);
    var type = xhr.getResponseHeader('content-type');
    var content = xhr.responseText;
    var cache = content;
    // Don't cache images and videos. Let the browser do that
    if (type.match(/image\//) || type.match(/video\//)){
      cache = url;
    }
    Manager.downloads[url] = {
      url: url,
      type: type,
      content: cache
    };
    return content;
  }

  function readPackageResponse(xhr){
    var urls = JSON.parse(xhr.responseText + "");
    for (var i = 0; i < urls.length; i += 1){
      urls[i] = normalizeUrl(urls[i], xhr.responseURL);
    }
    return urls;
  }

  export interface AssetData {
    url:string
    type:string
    content:any
  }

  export class Manager {
    assets = {};
    device:Glib.Graphics.Device;

    static loader = {};
    static parser = {};
    static downloads: { [uri:string]:AssetData } = {};

    constructor(device:Glib.Graphics.Device) {
      this.device = device;
    }

    load(type, asset:string):IPromise {
      var key, reader, data;

      // hash to cache the asset
      key = type + ':' + asset;

      debug(`[Manager] ${key} load`);

      // see if the asset is already loaded
      if (this.assets.hasOwnProperty(key)) {
        var result = this.assets[key];
        if (result.then) {
          debug(`[Manager] ${key} awaiting`);
          return result;
        }
        debug(`[Manager] ${key} asset exists`);
        return Promise.resolve(result);
      }

      // get the raw data from which to load the asset
      data = Manager.downloads[normalizeUrl(asset)];

      if (!data) {
        debug(`[Manager] ${key} begin download`);
        return this.download({ url: asset })
          .then(() => {
            debug(`[Manager] ${key} retry load`);
            return this.load(type, asset);
          });
      } else {
        debug(`[Manager] ${key} download exists`);
      }

      // find the reader who will process tha data into an asset
      reader = Manager.loader[type];
      if (!reader) {
        return Promise.reject(`Reader not found for type: ${String(type)}`);
      }
      if (typeof reader !== 'function') {
        return Promise.reject(`Reader ${String(type)} is not a function`);
      }
      this.assets[key] = Promise
        .resolve(reader(data, this))
        .then((result) => {
          this.assets[key] = result;
          return result;
        });
      return this.assets[key];
    }

    unload() {
      var i, obj, keys = Object.keys(this.assets);
      for (i = 0; i < keys.length; i += 1) {
        obj = this.assets[keys[i]];
        delete this.assets[keys[i]];
        if (typeof obj.unload === 'function') {
          obj.unload();
        }
      }
    }

    download(options) {
      debug('[Manager] download', options);
      return ajax(options)
        .then(function(res){
          debug('[Manager] download done', options);
          if (Array.isArray(res)){
            return res.map(function(xhr){ return cacheAssetResponse(xhr) });
          } else {
            return cacheAssetResponse(res);
          }
        });
    }

    downloadPackage(options){
      var deferred = Glib.Promise.defer();
      ajax(options)
        .then((res) => {
          if (!Array.isArray(res)){
            res = [res];
          }
          var urls = res.map(function(item ){
            return readPackageResponse(item)
          });
          urls = [].concat.apply([], urls);
          return this.download(extend({}, options, { url: urls }));
        })
        .then(function(res){
          return deferred.resolve(res);
        })
        .catch(function(arg){
          return deferred.reject(arg);
        });
      return deferred.promise;
    }

    static registerLoader(name:string, loadFunction:(data:any, assets:Manager)=>IPromise){
      Manager.loader[name] = loadFunction;
    }

    static registerParser(extName:string, parser:any){
      Manager.parser[extName] = parser;
    }

    parse(data:AssetData) {
      var extName = Glib.utils.path.ext(data.url);
      var parser = Manager.parser[extName];
      return parser(data.content);
    }
  }
}

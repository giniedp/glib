module Glib.Content {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;
  import extend = Glib.utils.extend;

  export var CDN = '';
  function normalizeUrl(url, baseUrl?:string) {
    return utils.path.merge(baseUrl || self.location.origin, url);
  }

  function cacheResponse(xhr) {
    var url = normalizeUrl(xhr.responseURL);
    var type = xhr.getResponseHeader('content-type');
    var content = xhr.responseText;
    var cache = content;
    // Don't cache images and videos. Let the browser do that
    if (type.match(/image\//) || type.match(/video\//)) {
      cache = url;
    }
    Manager.cacheDownload(url, {
      url: url,
      type: type,
      content: cache
    });
    return content;
  }

  function parsePackageResponse(xhr) {
    var urls = JSON.parse(xhr.responseText + "");
    for (var i = 0; i < urls.length; i += 1) {
      urls[i] = normalizeUrl(urls[i], xhr.responseURL);
    }
    return urls;
  }

  export interface AssetData {
    url:string
    type:string
    content:any
  }

  export interface AssetImporter {
    (asset:AssetData, manager:Manager): IPromise
  }

  export class Manager {
    assets = {};
    device:Glib.Graphics.Device;
    urlMap: any = {
      basicEffect: '/assets/shader/basic.yml'
    }

    constructor(device:Glib.Graphics.Device) {
      this.device = device;
    }

    static _importer = [];
    static _downloads:{ [uri:string]:AssetData } = {};

    static addImporter(format:string, assetType:string, importer:AssetImporter) {
      Manager._importer.push({
        format: format,
        asset: assetType,
        importer: importer
      });
    }

    static getImporter(format:string, assetType:string):AssetImporter {
      var global;
      for (var item of Manager._importer) {
        if (item.format === format && item.asset === assetType) {
          return item.importer;
        }
        if (item.format === 'all' && item.asset === assetType) {
          global = item.importer;
        }
      }
      if (global) {
        return global;
      }
      debug(`[Manager] '${format}' to '${assetType}' importer not found.`);
      return void 0;
    }

    static getImporterForAsset(asset:AssetData, assetType:string):AssetImporter {
      var ext = (Glib.utils.path.ext(asset.url) || '').replace(/^\./, '');
      return Manager.getImporter(ext, assetType);
    }

    static cacheDownload(url:string, asset:AssetData) {
      Manager._downloads[normalizeUrl(url)] = asset;
    }

    static getDownload(url:string):AssetData {
      return Manager._downloads[normalizeUrl(url)];
    }

    static download(options) {
      if (typeof options === 'string') {
        options = { url: options };
      }
      debug('[Manager] download', options);
      return Glib.utils.ajax(options).then(function (res) {
        // debug('[Manager] download done', options);
        if (!Array.isArray(res)) {
          return cacheResponse(res);
        }
        return res.map(function (xhr) {
          return cacheResponse(xhr)
        });
      });
    }

    download(options) {
      return Manager.download(options);
    }

    static downloadPackage(options) {
      return Glib.utils.ajax(options).then((res) => {
        res = [].concat.apply([], [res]);
        var urls = [].concat.apply([], res.map(parsePackageResponse));
        return Manager.download(extend({}, options, {url: urls}));
      });
    }

    downloadPackage(options) {
      return Manager.downloadPackage(options);
    }

    loadAssets(config: any): IPromise {
      let manager = this
      let result = {};
      
      let promises = [];
      Object.keys(config).forEach(function(key) {
        let type = key
        let value = config[type]
        if (Glib.utils.isString(value)) {
          promises.push(manager.load(type, value).then(function(res) {
            result[key] = res
          }))
        } else if (Glib.utils.isArray(value)) {
          let arr = result[key] = []
          value.forEach(function(path) {
            promises.push(manager.load(type, path).then(function(res) {
              arr.push(res)
            }))
          })
        } else if (Glib.utils.isObject(value)) {
          let obj = result[key] = {}
          Object.keys(value).forEach(function(key) {
            promises.push(manager.load(type, value[key]).then(function(res) {
              obj[key] = res
            }))
          })
        } else {
          throw "invalid configuration"
        }
      })

      return Glib.Promise.all(promises).then(function() {
        return result
      })
    }
    load(assetType, assetPath:string):IPromise {

      // hash to cache the asset
      var key = assetType + ':' + assetPath;
      debug(`[Manager] ${key} load`);

      // see if the asset is already loaded
      if (this.assets.hasOwnProperty(key)) {
        var result = this.assets[key];
        if (result.then) {
          debug(`[Manager] ${key} awaiting`);
          return result;
        }
        debug(`[Manager] ${key} exists`);
        return Promise.resolve(result);
      }

      return this.assets[key] = Promise.resolve(function() {
        var data = Manager.getDownload(assetPath);
        if (!data) {
          // debug(`[Manager] ${key} download begin`);
          return this.download({url: assetPath}).then(function() {
            // debug(`[Manager] ${key} download complete`);
            return Manager.getDownload(assetPath)
          })
        } else {
          // debug(`[Manager] ${key} download exists`);
          return data
        }
      }.bind(this)()).then(function(data) {
        if (!data) {
          return Promise.reject(`no data found for asset: ${assetPath}`);
        }
        var importer = Manager.getImporterForAsset(data, assetType);
        if (!importer) {
          return Promise.reject(`no importer found for type: ${String(assetType)}`);
        }
        if (typeof importer !== 'function') {
          return Promise.reject(`importer '${String(assetType)}' is not a function`);
        }
        return Promise.resolve(importer(data, this)).then((result) => {
          this.assets[key] = result;
          return result;
        });
      }.bind(this))
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
  }
}

module Glib.Content {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;
  import extend = Glib.utils.extend;

  function normalizeUrl(url, baseUrl?:string) {
    return utils.path.merge(baseUrl || window.location.origin, url);
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
        debug('[Manager] download done', options);
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
        debug(`[Manager] ${key} asset exists`);
        return Promise.resolve(result);
      }

      // get the raw data from which to load the asset
      var data = Manager.getDownload(assetPath);
      if (!data) {
        debug(`[Manager] ${key} begin download`);
        return this.download({url: assetPath})
          .then(() => {
            debug(`[Manager] ${key} retry load`);
            return this.load(assetType, assetPath);
          });
      } else {
        debug(`[Manager] ${key} download exists`);
      }

      // find the reader who will process tha data into an asset
      var importer = Manager.getImporterForAsset(data, assetType);
      if (!importer) {
        return Promise.reject(`Reader not found for type: ${String(assetType)}`);
      }
      console.log(importer);
      if (typeof importer !== 'function') {
        return Promise.reject(`Reader ${String(assetType)} is not a function`);
      }
      this.assets[key] = Promise
        .resolve(importer(data, this))
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
  }
}

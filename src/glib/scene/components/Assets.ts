module Glib.Components {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;
  import extend = Glib.utils.extend;
  import ajax = Glib.utils.ajax;
  import normalizeUrl = Glib.utils.normalizeUrl;

  function cacheAssetResponse(xhr){
    var url = utils.normalizeUrl(xhr.responseURL);
    var type = xhr.getResponseHeader('content-type');
    var content = xhr.responseText;
    var cache = content;
    // Don't cache images and videos. Let the browser do that
    if (type.match(/image\//) || type.match(/video\//)){
      cache = url;
    }
    Assets.downloads[url] = {
      url: url,
      type: type,
      content: cache
    };
    return content;
  }

  function readPackageResponse(xhr){
    var sourceUrl = xhr.responseURL;
    var baseUrl = sourceUrl.substr(0, sourceUrl.lastIndexOf('/') + 1);
    var urls = JSON.parse(xhr.responseText + "");
    for (var i = 0; i < urls.length; i += 1){
      urls[i] = normalizeUrl(urls[i], baseUrl);
    }
    return urls;
  }

  export interface AssetData {
    url:string
    type:string
    content:any
  }

  export class Assets {
    node:Entity;
    name:string = 'Assets';
    service:boolean = true;

    assets = {};
    device:Glib.Graphics.Device;

    static reader = {};
    static downloads: { [uri:string]:AssetData } = {};

    setup() {
      this.device = this.node.root.getService('Device');
    }

    load(type, asset:string):IPromise {
      var key, reader, data;

      // hash to cache the asset
      key = type + ':' + asset;

      debug('[Assets]', 'load', key, asset);

      // see if the asset is already loaded
      if (this.assets.hasOwnProperty(key)) {
        debug('[Assets]', 'already loaded', key);
        return Promise.resolve(this.assets[key]);
      }

      // get the raw data from which to load the asset
      data = Assets.downloads[utils.normalizeUrl(asset)];

      if (!data) {
        debug('[Assets]', 'begin download', key, asset);
        return this.download({ url: asset })
          .then(() => {
            debug('[Assets]', 'retry', key, asset);
            return this.load(type, asset);
          });
      } else {
        debug('[Assets]', 'already downloaded', key, asset);
      }

      // find the reader who will process tha data into an asset
      reader = Assets.reader[type];
      if (!reader) {
        return Promise.reject(`Reader not found for type: ${String(type)}`);
      }
      if (typeof reader !== 'function') {
        return Promise.reject(`Reader ${String(type)} is not a function`);
      }

      return Promise
        .resolve(reader(data, this))
        .then((result) => {
          this.assets[key] = result;
          return result;
        });
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
      debug('[Assets]', 'download', arguments);
      return ajax(options)
        .then(function(res){
          debug('[Assets]', 'download done', res);
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

    static registerLoader(name:string, loadFunction:(data:any, assets:Assets)=>IPromise){
      Assets.reader[name] = loadFunction;
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  loaded assets: ${Object.keys(this.assets).length}`
      ].join("\n")
    }
  }
}

module Glib.Components {

  import Graphics = Glib.Graphics;
  import log = Glib.utils.log;
  import debug = Glib.utils.debug;
  import normalizeUrl = Glib.utils.normalizeUrl;

  Assets.registerLoader("Texture2D", loadTexture2d);
  function loadTexture2d(data, assets:Assets) {
    debug('[Assets]', "loadTexture2d", arguments);
    return assets
      .load('Image', data.content)
      .then(function(video){
        return assets.device.createTexture({
          type: Graphics.TextureType.Texture2D,
          data: video
        })
      });
  }

  Assets.registerLoader("TextureCube", loadTextureCube);
  function loadTextureCube(data, assets:Assets) {
    debug('[Assets]', "loadTextureCube", arguments);
    return assets
      .load('Image', data.content)
      .then(function(video){
        return assets.device.createTexture({
          type: Graphics.TextureType.TextureCube,
          data: video
        })
      });
  }

  Assets.registerLoader("TextureVideo", loadTextureVideo);
  function loadTextureVideo(data, assets:Assets) {
    debug('[Assets]', "loadTextureVideo", arguments);
    return assets
      .load('Video', data.content)
      .then(function(video){
        return assets.device.createTexture({
          type: Graphics.TextureType.Texture2D,
          data: video
        })
      });
  }

  Assets.registerLoader("Image", loadImage);
  function loadImage(data) {
    debug('[Assets]', "loadImage", arguments);
    if (!data.type.match(/image\//)) {
      return Promise.reject(`Can not load content type of ${data.type} as image`);
    }
    var deferred = Promise.defer();
    var image = new Image();
    image.onload = function(){
      image.onload = null;
      image.onerror = null;
      deferred.resolve(this);
    };
    image.onerror = function(e){
      image.onload = null;
      image.onerror = null;
      deferred.reject(e, image);
    };
    image.src = data.url;

    return deferred.promise;
  }

  Assets.registerLoader("Video", loadVideo);
  function loadVideo(data) {
    debug('[Assets]', "loadVideo", arguments);
    if (!data.type.match(/video\//)) {
      return Promise.reject(`Can not load content type of ${data.type} as video`);
    }
    var video = document.createElement('video');
    video.src = data.url;
    return Promise.resolve(video);
  }

  Assets.registerLoader("YamlShaderSource", loadYamlShaderSource);
  function loadYamlShaderSource(data) {
    debug('[Assets]', "loadYamlShaderSource", arguments);
    return Promise.resolve(Glib.utils.parseYamlShader(data.content, {
      includes: Assets.downloads
    }));
  }

  Assets.registerLoader("Material", loadMaterial);
  function loadMaterial(data, assets:Assets){
    debug('[Assets]', "loadMaterial", arguments); // IF DEBUG
    var baseUrl = data.url.substr(0, data.url.lastIndexOf('/') + 1);
    var materialJson = JSON.parse(data.content);
    var effectUrl = normalizeUrl(materialJson.effect, baseUrl);

    return assets
      .load('YamlShaderSource', effectUrl)
      .then(function(material){
        material.parameters = materialJson.parameters;

        var params = material.parameters || {};
        var map = Object.keys(params).map(function(key){
          if (typeof params[key] !== 'string'){
            return params[key];
          }
          return assets
            .load('Texture2D', normalizeUrl(params[key], baseUrl))
            .then(function(texture){
              params[key] = texture;
            });
        });
        return Promise.all(map).then(function(){
          return new Graphics.Material(assets.device, material);
        });
      });
  }

  Assets.registerLoader("Model", loadModel);
  function loadModel(data, assets:Assets) {
    debug('[Assets]', "loadModel", arguments); // IF DEBUG
    var baseUrl = data.url.substr(0, data.url.lastIndexOf('/') + 1);
    var jsonModel = JSON.parse(data.content);
    var materials = jsonModel.materials || [];
    var loadMaterials = materials.map(function(materialUrl, index){
      return assets
        .load("Material", normalizeUrl(materialUrl, baseUrl))
        .then(function(material){
          materials[index] = material;
        });
    });
    return Promise.all(loadMaterials).then(function(){
      return new Graphics.Model(assets.device, jsonModel);
    });
  }
}

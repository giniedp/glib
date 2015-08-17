module Glib.Content.Importer {

  import path = Glib.utils.path;
  import debug = Glib.utils.debug;

  function loadEffect(asset:AssetData, data, manager:Manager){
    var effectUrl = path.merge(asset.url, data.effect);
    return manager
      .load('Effect', effectUrl)
      .then(function(effect){
        delete data.effect;
        data.techniques = effect.techniques;
      });
  }

  function loadTextures(asset:AssetData, data, manager:Manager){
    var parameters = data.parameters;
    var keys = Object.keys(parameters);
    var map = keys.map(function (key) {
      if (typeof parameters[key] !== 'string') {
        return parameters[key];
      }
      var textureUrl = path.merge(asset.url, parameters[key]);
      return manager
        .load('Texture2D', textureUrl)
        .then(function (texture) {
          parameters[key] = texture;
        });
    });
    return Promise.all(map);
  }

  export function loadJsonMaterial(json:any, asset:AssetData, manager:Manager):IPromise {
    var wasArray = Array.isArray(json);
    json = wasArray ? json : [json];
    return Promise.all(json.map(function(data:any){
      return Promise.all([
        loadEffect(asset, data, manager),
        loadTextures(asset, data, manager)
      ]).then(function(){
        return new Glib.Graphics.Material(manager.device, data);
      });
    })).then(function(res) {
      return wasArray ? res : res[0];
    });
  }

  export function importJsonMaterial(asset:AssetData, manager:Manager):IPromise {
    debug('[Manager] ImportJsonMaterial', asset);
    var json:any = JSON.parse(asset.content);
    return loadJsonMaterial(json, asset, manager);
  }

  Manager.addImporter('json', 'Material', importJsonMaterial);
}

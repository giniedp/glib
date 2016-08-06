module Glib.Content.Importer {

  import path = Glib.utils.path;
  import debug = Glib.utils.debug;

  function loadEffect(asset:AssetData, data, manager:Manager){
    var effectUrl = path.merge(asset.url, manager.urlMap[data.effect] || data.effect);
    //debug('[ImportJsonMaterial] loadEffect', effectUrl);
    return manager.load('Effect', effectUrl)
      .then(function(effect){
        delete data.effect;
        data.techniques = Glib.utils.copy(true, effect.techniques);
      });
  }

  function loadTextures(asset:AssetData, data, manager:Manager){
    var parameters = data.parameters;
    var keys = Object.keys(parameters);
    return Promise.all(keys.map(function (key) {
      if (typeof parameters[key] !== 'string') {
        return parameters[key];
      }
      var textureUrl = path.merge(asset.url, parameters[key]);
      //debug('[ImportJsonMaterial] loadTexture', textureUrl);
      return manager.load('Texture2D', textureUrl)
        .then(function (texture) {
          parameters[key] = texture;
        });
    }));
  }

  export function loadJsonMaterial(json:any, asset:AssetData, manager:Manager):IPromise {
    //debug('[LoadJsonMaterial]', json);
    var wasArray = Array.isArray(json);
    json = wasArray ? json : [json];
    return Promise.all(json.map(function(data:any){
      return Promise.all([
        loadEffect(asset, data, manager),
        loadTextures(asset, data, manager)
      ]).then(function(){
        return new Glib.Graphics.ShaderMaterial(manager.device, data);
      });
    })).then(function(res) {
      return wasArray ? res : res[0];
    });
  }

  export function importJsonMaterial(asset:AssetData, manager:Manager):IPromise {
    //debug('[ImportJsonMaterial]', asset);
    var json:any = JSON.parse(asset.content);
    return loadJsonMaterial(json, asset, manager);
  }

  Manager.addImporter('json', 'Material', importJsonMaterial);
}

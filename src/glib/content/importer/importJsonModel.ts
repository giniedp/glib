module Glib.Content.Importer {

  import Graphics = Glib.Graphics;
  import debug = Glib.utils.debug;

  export function loadJsonModel(json:any, data:AssetData, manager:Manager):IPromise {
    debug('[LoadJsonModel]', json);
    var materials = json.materials || [];
    return Promise.all(materials.map(function(materialUrl){
      materialUrl = Glib.utils.path.merge(data.url, materialUrl);
      return manager.load("Material", materialUrl);
    })).then(function(materials){
      json.materials = [].concat.apply([], materials);
      return new Graphics.Model(manager.device, json);
    });
  }

  export function importJsonModel(data:AssetData, manager:Manager) {
    debug('[ImportJsonModel]', data);
    var json = JSON.parse(data.content);
    return loadJsonModel(json, data, manager);
  }

  Manager.addImporter('json', 'Model', importJsonModel);
}

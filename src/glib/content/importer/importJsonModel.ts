module Glib.Content.Importer {

  import Graphics = Glib.Graphics;
  import debug = Glib.utils.debug;

  export function loadJsonModel(json:any, data:AssetData, manager:Manager):IPromise {
    var materials = json.materials || [];
    var loadMaterials = materials.map(function(materialUrl, index){
      materialUrl = Glib.utils.path.merge(data.url, materialUrl);

      return manager
        .load("Material", materialUrl)
        .then(function(material){
          materials[index] = material;
        });
    });
    return Promise.all(loadMaterials).then(function(){
      json.materials = [].concat.apply([], json.materials);
      return new Graphics.Model(manager.device, json);
    });
  }

  export function importJsonModel(data:AssetData, manager:Manager) {
    debug('[Manager] ImportJsonModel', arguments);
    var json = JSON.parse(data.content);
    return loadJsonModel(json, data, manager);
  }

  Manager.addImporter('json', 'Model', importJsonModel);
}

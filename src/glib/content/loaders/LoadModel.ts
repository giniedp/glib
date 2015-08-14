module Glib.Content.Loaders {
  import Graphics = Glib.Graphics;
  import log = Glib.utils.log;
  import debug = Glib.utils.debug;

  Manager.registerLoader("Model", LoadModel);
  function LoadModel(data, manager:Manager) {
    debug('[Manager] LoadModel', arguments);
    var content:any = manager.parse(data);

    var materials = content.materials || [];
    var loadMaterials = materials.map(function(materialUrl, index){
      materialUrl = Glib.utils.path.merge(data.url, materialUrl);

      return manager
        .load("Material", materialUrl)
        .then(function(material){
          materials[index] = material;
        });
    });
    return Promise.all(loadMaterials).then(function(){
      content.materials = [].concat.apply([], content.materials);
      return new Graphics.Model(manager.device, content);
    });
  }
}

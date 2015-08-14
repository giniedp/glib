module Glib.Content.Loaders {

  import Graphics = Glib.Graphics;
  import log = Glib.utils.log;
  import debug = Glib.utils.debug;

  Manager.registerLoader("Material", LoadMaterial);
  function LoadMaterial(data:AssetData, manager:Manager) {
    debug('[Manager] LoadMaterial', arguments);
    var content:any = manager.parse(data);

    function load(content) {
      var effectUrl = Glib.utils.path.merge(data.url, content.effect);
      return manager
        .load('YamlShaderSource', effectUrl)
        .then(function (material) {
          material.parameters = content.parameters;

          var params = material.parameters || {};
          var map = Object.keys(params).map(function (key) {
            if (typeof params[key] !== 'string') {
              return params[key];
            }
            var textureUrl = Glib.utils.path.merge(data.url, params[key]);
            return manager
              .load('Texture2D', textureUrl)
              .then(function (texture) {
                params[key] = texture;
              });
          });
          return Promise.all(map).then(function () {
            return new Graphics.Material(manager.device, material);
          });
        });
    }

    if (Array.isArray(content)) {
      return Glib.Promise.all(content.map(function(content){
        return load(content);
      }))
    } else {
      return load(content);
    }
  }
}

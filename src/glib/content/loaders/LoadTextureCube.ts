module Glib.Content.Loaders {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;

  Manager.registerLoader("TextureCube", LoadTextureCube);
  function LoadTextureCube(data, manager:Manager) {
    debug('[Manager] LoadTextureCube', arguments);
    return manager
      .load('Image', data.content)
      .then(function (video) {
        return manager.device.createTexture({
          type: Graphics.TextureType.TextureCube,
          data: video
        })
      });
  }
}

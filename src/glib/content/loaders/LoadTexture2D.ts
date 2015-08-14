module Glib.Content.Loaders {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;

  Manager.registerLoader("Texture2D", LoadTexture2D);
  function LoadTexture2D(data, manager:Manager) {
    debug('[Manager] LoadTexture2D', arguments);
    return manager
      .load('Image', data.content)
      .then(function (video) {
        return manager.device.createTexture({
          type: Graphics.TextureType.Texture2D,
          data: video
        })
      });
  }
}

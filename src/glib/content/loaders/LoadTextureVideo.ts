module Glib.Content.Loaders {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;

  Manager.registerLoader("TextureVideo", LoadTextureVideo);
  function LoadTextureVideo(data, manager:Manager) {
    debug('[Manager] LoadTextureVideo', arguments);
    return manager
      .load('Video', data.content)
      .then(function (video) {
        return manager.device.createTexture({
          type: Graphics.TextureType.Texture2D,
          data: video
        })
      });
  }
}

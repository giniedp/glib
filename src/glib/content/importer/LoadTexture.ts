module Glib.Content.Importer {

  import debug = Glib.utils.debug;

  Manager.addImporter('all', 'Image', loadImage);
  export function loadImage(data):IPromise {
    debug('[Manager] LoadImage', arguments);
    if (!data.type.match(/image\//)) {
      return Promise.reject(`Can not load content type of ${data.type} as image`);
    }

    var deferred = Glib.Promise.defer();
    var image = new Image();
    image.onload = function () {
      image.onload = null;
      image.onerror = null;
      deferred.resolve(this);
    };
    image.onerror = function (e) {
      image.onload = null;
      image.onerror = null;
      deferred.reject(e, image);
    };
    image.src = data.url;

    return deferred.promise;
  }

  Manager.addImporter('all', 'Video', loadVideo);
  function loadVideo(data) {
    debug('[Manager] LoadVideo', arguments);
    if (!data.type.match(/video\//)) {
      return Promise.reject(`Can not load content type of ${data.type} as video`);
    }
    var video = document.createElement('video');
    video.src = data.url;
    return Promise.resolve(video);
  }

  Manager.addImporter('all', 'Texture2D', loadTexture2D);
  export function loadTexture2D(data:AssetData, manager:Manager):IPromise {
    debug('[Manager] LoadTexture2D', arguments);
    return manager.load('Image', data.content)
      .then(function (res) { return manager.device.createTexture2D({ data: res }) });
  }

  Manager.addImporter('all', 'TextureCube', loadTextureCube);
  export function loadTextureCube(data:AssetData, manager:Manager):IPromise {
    debug('[Manager] LoadTexture2D', arguments);
    return manager.load('Image', data.content)
      .then(function (res) { return manager.device.createTextureCube({ data: res }) });
  }

  Manager.addImporter('all', 'TextureVideo', loadTextureVideo);
  function loadTextureVideo(data, manager:Glib.Content.Manager):IPromise {
    debug('[Manager] LoadTextureVideo', arguments);
    return manager.load('Video', data.content)
      .then(function (res) { return manager.device.createTexture2D({ data: res }) });
  }
}

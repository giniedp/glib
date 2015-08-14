module Glib.Content.Loaders {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;

  Manager.registerLoader("Image", LoadImage);
  function LoadImage(data) {
    debug('[Manager] LoadImage', arguments);
    if (!data.type.match(/image\//)) {
      return Promise.reject(`Can not load content type of ${data.type} as image`);
    }
    var deferred = Promise.defer();
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
}

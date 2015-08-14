module Glib.Content.Loaders {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;

  Manager.registerLoader("Video", LoadVideo);
  function LoadVideo(data) {
    debug('[Manager] LoadVideo', arguments);
    if (!data.type.match(/video\//)) {
      return Promise.reject(`Can not load content type of ${data.type} as video`);
    }
    var video = document.createElement('video');
    video.src = data.url;
    return Promise.resolve(video);
  }
}

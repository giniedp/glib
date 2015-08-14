module Glib.Content.Loaders {

  import log = Glib.utils.log;
  import debug = Glib.utils.debug;

  Manager.registerLoader("YamlShaderSource", LoadYamlShaderSource);
  function LoadYamlShaderSource(data) {
    debug('[Manager] LoadYamlShaderSource', arguments);
    return Promise.resolve(Glib.utils.parseYamlShader(data.content, {
      includes: Manager.downloads
    }));
  }
}

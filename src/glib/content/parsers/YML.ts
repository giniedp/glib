module Glib.Content.Parsers {
  Manager.registerParser(".yml", parseYml);
  function parseYml(content){
    return Glib.utils.parseYaml(content);
  }
}

module Glib.Content.Parsers {

  parseJson['contentType'] = ["application/json"];
  Manager.registerParser(".json", parseJson);
  function parseJson(content){
    return JSON.parse(content);
  }

}

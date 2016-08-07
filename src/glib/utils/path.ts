module Glib.utils.path {
  // source: https://github.com/nodejs/node/blob/master/lib/path.js
  var pathSplit = /^(\/?|[\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  // source: http://blog.stevenlevithan.com/archives/parseuri
  var options = {
    key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
    q:   {
      name:   "queryKey",
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  };

  export function parseUri(str, strict=true):any {
    var	o = options;
    var m = o.parser[strict ? "strict" : "loose"].exec(str);
    var uri = {};
    var i = 14;

    while (i--) uri[o.key[i]] = m[i] || "";

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
      if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
  }

  function normalizeArray(tokens) {
    var result = [];
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (!token || token === ".") continue;
      if (token === "..") {
        result.pop();
      } else {
        result.push(token);
      }
    }
    return result;
  }

  export function collapsePath(path) {
    return normalizeArray(path.split(/\//)).join("/")
  }

  export function isAbsolute(path) {
    return !!path && path[0] === '/';
  }

  export function hasProtocol(path) {
    return !!path && !!path.match(/^[a-zA-Z]+:\/\//i);
  }

  export function dir(path) {
    return parseUri(path).directory;
  }

  export function basename(path) {
    return pathSplit.exec(path)[2];
  }

  export function ext(path) {
    return pathSplit.exec(path)[3];
  }

  export function merge(a:string, b:string){
    if (hasProtocol(b)) {
      return b;
    }

    var aUri = parseUri(a);
    var bUri = parseUri(b);
    var path = isAbsolute(b) ? b : aUri.directory + bUri.path;
    path = collapsePath(path);

    var result = "";
    if (aUri.protocol) result = aUri.protocol + "://";
    if (aUri.authority) result += aUri.authority + "/";
    return result + path;
  }
}

module Glib.utils.path {
  // source: https://github.com/nodejs/node/blob/master/lib/path.js
  let pathSplit = /^(\/?|[\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  // source: http://blog.stevenlevithan.com/archives/parseuri
  let options = {
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
    let m = o.parser[strict ? "strict" : "loose"].exec(str);
    let uri = {};
    let i = 14;

    while (i--) uri[o.key[i]] = m[i] || "";

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
      if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
  }

  function normalizeArray(tokens) {
    let result = [];
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
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
    let result = normalizeArray(path.split(/\//)).join("/")
    if (isAbsolute(path)) result = `/${result}`
    return result
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
    if (hasProtocol(b)) return b

    let aUri = parseUri(a)
    let bUri = parseUri(b)
    let path = isAbsolute(b) ? b : aUri.directory + bUri.path
    path = collapsePath(path)

    let result = "";
    if (aUri.protocol) result = aUri.protocol + "://"
    if (aUri.authority) result += aUri.authority
    if (!isAbsolute(path)) result += "/"
    return result + path;
  }
}

module Glib.utils {
  export function normalizeUrl(url:string, baseUrl?:string){
    if (url.match(/https?:\/\//)){
      return url;
    }
    var isRoot = url[0] === '/';
    var result = '';

    if (!baseUrl){
      baseUrl = window.location.origin;
    }
    if (baseUrl[baseUrl.length - 1] !== '/'){
      baseUrl += '/';
    }
    if (isRoot){
      // TODO: use origin of baseUrl
      result = baseUrl + url.substring(1);
    } else {
      result = baseUrl + url;
    }
    while(result.match(/[a-zA-Z0-9]+\/\.\.\//)){
      result = result.replace(/[a-zA-Z0-9]+\/\.\.\//, '');
    }
    while(result.match(/\.\//)){
      result = result.replace(/\.\//i, '');
    }
    return result;
  }
}
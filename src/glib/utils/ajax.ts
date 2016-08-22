module Glib.utils {

  export interface AjaxOptions {
    url:string
    type?:string
    async?:boolean
    username?:string
    password?:string
    headers?: { [key:string]:string }
  }

  export function ajax(options):IPromise {
    var xhr = options.xhr || new XMLHttpRequest()

    if (Array.isArray(options.url)) {
      var mapped = options.url.map(function (url) {
        return ajax(extend({}, options, {url: url})).then(function (res) {
          return res
        });
      });
      return Glib.Promise.all(mapped)
    }

    var deferred = Promise.defer()
    let async = options.async === false ? false : true
    xhr.open(
      options.type || 'GET',
      options.url,
      async,
      options.username,
      options.password);

    let headers = options.headers || {}
    for (let key in headers) {
      xhr.setRequestHeader(key, headers[key])
    }

    let complete = function (xhr) {
      xhr.options = options
      if (!xhr.responseURL) {
        xhr.responseURL = options.url
      }
      if (200 <= xhr.status && xhr.status < 400) {
        deferred.resolve(xhr)
      } else {
        deferred.reject(xhr)
      }
    };

    if (async) {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          xhr.requestURL = options.url
          complete(xhr)
        }
      };
      xhr.send(null)
    } else {
      xhr.send(null)
      complete(xhr)
    }
    return deferred.promise
  }
}

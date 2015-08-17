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
    var xhr = options.xhr || new XMLHttpRequest();
    options.async = options.async !== false;
     
    if (Array.isArray(options.url)) {
      var mapped = options.url.map(function (url) {
        return ajax(extend({}, options, {url: url})).then(function (res) {
          return res;
        });
      });
      return Glib.Promise.all(mapped);
    }

    var deferred = Promise.defer();

    xhr.open(
      options.type || 'GET',
      options.url,
      options.async,
      options.username,
      options.password);

    var headers = options.headers || {};
    for (var key in headers) {
      xhr.setRequestHeader(key, headers[key]);
    }

    var complete = function (xhr) {
      xhr.options = options;
      if (!xhr.responseURL) {
        xhr.responseURL = options.url;
      }
      if (200 <= xhr.status && xhr.status < 400) {
        deferred.resolve(xhr);
      } else {
        deferred.reject(xhr);
      }
    };

    if (options.async) {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          xhr.requestURL = options.url;
          complete(xhr);
        }
      };
      xhr.send(null);
    } else {
      xhr.send(null);
      complete(xhr);
    }
    return deferred.promise;
  }
}

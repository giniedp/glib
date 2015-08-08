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
      // TODO: check for status code
      deferred.resolve(xhr);
    };

    if (options.async) {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
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

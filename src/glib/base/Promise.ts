module Glib {
  export interface IPromise {
    then:(arg:any, ...argRest:any[])=>any|IPromise
    catch:(arg:any, ...argRest:any[])=>any|IPromise
  }

  export var Promise:any = window["Promise"];

  if (Promise && !Promise['defer']) {
    Promise['defer'] = function(){
      var resolved = false;
      var resolveArg = undefined;
      var rejected = false;
      var rejectArg = undefined;
      var executor = {
        promise: null,
        resolve: function(){ resolved = true; resolveArg = arguments; },
        reject: function(){ rejected = true; rejectArg = arguments; }
      };
      executor.promise = new Promise(function(resolve, reject){
        executor.resolve = resolve;
        executor.reject = reject;
        if (resolved) { resolve.apply(this, resolveArg); }
        if (rejected) { reject.apply(this, rejectArg); }
      });
      return executor;
    }
  }
}

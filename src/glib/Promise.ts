module Glib {
  export interface IPromise {
    then:(arg:any, ...argRest:any[])=>any|IPromise
    catch:(arg:any, ...argRest:any[])=>any|IPromise
  }

  export let Promise:any = self["Promise"];

  if (Promise && !Promise['defer']) {
    Promise['defer'] = function(){
      let resolved = false;
      let resolveArg = undefined;
      let rejected = false;
      let rejectArg = undefined;
      let executor = {
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

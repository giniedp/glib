module Glib {
  export interface IPromise {
    then:(arg:any, ...argRest:any[])=>any|IPromise
    catch:(arg:any, ...argRest:any[])=>any|IPromise
  }

  export var Promise:any = window["Promise"];
}
/// <reference path="Entity.ts"/>

module Glib {
  export interface Component {
    node?:Entity;
    name?:string;
    setup?:()=>void;
    update?:(time?:number)=>void;
    loadContent?:()=>void;
    service?:boolean;
    enabled?:boolean;
    visible?:boolean;
  }
}
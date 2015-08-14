module Glib.Components {

  export class Assets {
    node:Entity;
    name:string = 'Assets';
    service:boolean = true;

    manager:Glib.Content.Manager;
    device:Glib.Graphics.Device;

    setup() {
      this.device = this.node.root.getService('Device');
      this.manager = new Glib.Content.Manager(this.device);
    }

    load(type, asset:string):IPromise {
      return this.manager.load(type, asset);
    }

    unload() {
      return this.manager.unload();
    }

    download(options) {
      return this.manager.download(options);
    }

    downloadPackage(options){
      return this.manager.downloadPackage(options);
    }

    debug():string {
      return [
        `- component: ${this.name}`,
        `  loaded assets: ${Object.keys(this.manager.assets).length}`
      ].join("\n")
    }
  }
}


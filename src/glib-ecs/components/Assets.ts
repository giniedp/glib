module Glib.Components {

  export class Assets {
    public node: Entity
    public name: string = 'Assets'
    public service: boolean = true

    public manager: Glib.Content.Manager
    public device: Glib.Graphics.Device

    public setup() {
      this.device = this.node.root.getService('Device')
      this.manager = new Glib.Content.Manager(this.device)
    }

    public load(type, asset: string): IPromise {
      return this.manager.load(type, asset)
    }

    public loadAssets(config: any): IPromise {
      return this.manager.loadAssets(config)
    }

    public unload() {
      return this.manager.unload()
    }

    public download(options) {
      return this.manager.download(options)
    }

    public debug(): string {
      return [
        `- component: ${this.name}`,
        `  loaded assets: ${Object.keys(this.manager.loaded).length}`
      ].join('\n')
    }
  }
}


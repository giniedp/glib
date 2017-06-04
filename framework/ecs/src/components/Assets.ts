import * as Content from '@glib/content'
import { AjaxOptions } from '@glib/core'
import * as Graphics from '@glib/graphics'
import { Entity } from './../Entity'

export class Assets {
  public node: Entity
  public name: string = 'Assets'
  public service: boolean = true

  public manager: Content.Manager
  public device: Graphics.Device

  public setup() {
    this.device = this.node.root.getService('Device')
    this.manager = new Content.Manager(this.device)
  }

  public load(type: string, asset: string): Promise<any> {
    return this.manager.load(type, asset)
  }

  public loadAssets(config: any): Promise<any> {
    return this.manager.loadAssets(config)
  }

  public unload() {
    return this.manager.unload()
  }

  public download(options: string | AjaxOptions) {
    return this.manager.download(options)
  }

  public debug(): string {
    return [
      `- component: ${this.name}`,
      `  loaded assets: ${Object.keys(this.manager.loaded).length}`,
    ].join('\n')
  }
}


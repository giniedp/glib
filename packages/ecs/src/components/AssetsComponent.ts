import * as Content from '@gglib/content'
import { HttpOptions } from '@gglib/core'
import * as Graphics from '@gglib/graphics'
import { Component } from './../Component'
import { Entity } from './../Entity'

export class AssetsComponent implements Component {
  public entity: Entity
  public name: string = 'Assets'
  public service: boolean = true

  public manager: Content.Manager
  public device: Graphics.Device

  public setup() {
    this.device = this.entity.root.getService('Device')
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

  public download(options: string | HttpOptions): Promise<Content.RawAsset> {
    return this.manager.download(options)
  }
}

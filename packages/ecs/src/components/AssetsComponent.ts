import * as Content from '@gglib/content'
import { HttpOptions, Type } from '@gglib/core'
import * as Graphics from '@gglib/graphics'

import { Component } from './../Component'
import { Entity } from './../Entity'

/**
 * @public
 */
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

  public load<T = any>(asset: string, type: symbol | Type<T>): Promise<T> {
    return this.manager.load(asset, type)
  }

  public loadBatch(config: any): Promise<any> {
    return this.manager.loadBatch(config)
  }

  public unload() {
    return this.manager.unload()
  }

  public download(options: string | HttpOptions): Promise<Content.Data> {
    return this.manager.download(options)
  }
}

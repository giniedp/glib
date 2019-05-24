import { Data as ContentData, Manager as ContentManager } from '@gglib/content'
import { HttpOptions, Type } from '@gglib/core'
import { Device as GraphicsDevice } from '@gglib/graphics'

import { Component } from './../Component'
import { Entity } from './../Entity'

/**
 * @public
 */
export class AssetsComponent implements Component {
  public readonly name: string = 'Assets'
  public readonly service: boolean = true

  public entity: Entity
  public manager: ContentManager
  public device: GraphicsDevice

  public setup() {
    this.device = this.entity.root.getService('Device')
    this.manager = new ContentManager(this.device)
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

  public download(options: string | HttpOptions): Promise<ContentData> {
    return this.manager.download(options)
  }
}

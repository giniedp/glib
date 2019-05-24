import { Device, DeviceOptions } from '@gglib/graphics'

import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate, TemplateFunction, TemplateMap } from '../Template'

interface GameOptions extends DeviceOptions {
  templates?: Array<string|TemplateFunction|TemplateMap>,
  autorun?: boolean,
}

addTemplate('Game', (
  entity: Entity,
  options: GameOptions = {},
) => {
  entity
    .addService('Device', new Device({
      canvas: options.canvas,
      context: options.context,
      contextAttributes: options.contextAttributes,
    }))
    .addComponent(new Components.GameLoopComponent())
    .addComponent(new Components.TimeComponent())
    .addComponent(new Components.FpsComponent())
    .addComponent(new Components.AssetsComponent())
    .addComponent(new Components.RendererComponent())
  if (options.templates) {
    entity.applyTemplates(options.templates)
  }
  if (options.autorun !== false) {
    entity.getService('GameLoop').run()
  }
})

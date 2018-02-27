import { ContextAttributes, Device } from '@glib/graphics'

import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate, Template } from '../Template'

addTemplate('Game', (
  entity: Entity,
  options: {
    canvas?: HTMLCanvasElement,
    context?: string | WebGLRenderingContext | WebGL2RenderingContext,
    contextAttributes?: ContextAttributes,
    templates?: Array<string|Template>,
    autorun?: boolean,
  } = {},
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

import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('DirectionalLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Directional
    entity.addComponent(new Components.LightComponent(options))
  }
})

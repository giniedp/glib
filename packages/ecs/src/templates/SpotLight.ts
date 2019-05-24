import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('SpotLight', (entity: Entity, options: any = {}) => {
  if (!entity.services.Light) {
    options = options || {}
    options.type = Components.LightType.Spot
    entity.addComponent(new Components.LightComponent(options))
  }
})

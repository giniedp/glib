import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('PointLight', (entity: Entity, options: any = {}) => {
  if (!entity.services.Light) {
    options = options || {}
    options.type = Components.LightType.Point
    entity.addComponent(new Components.LightComponent(options))
  }
})

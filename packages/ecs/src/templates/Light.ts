import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('Light', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Light) {
    entity.addComponent(new Components.LightComponent(options))
  }
})

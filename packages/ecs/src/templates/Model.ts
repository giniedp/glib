import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('Model', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Renderable) {
    entity.addComponent(new Components.ModelComponent(options))
  }
})
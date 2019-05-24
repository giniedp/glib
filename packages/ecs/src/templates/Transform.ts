import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('Transform', (entity: Entity) => {
  if (!entity.services.Transform) {
    entity.addComponent(new Components.TransformComponent())
  }
})

import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('Transform', (entity: Entity) => {
  if (!entity.s.Transform) {
    entity.addComponent(new Components.TransformComponent())
  }
})

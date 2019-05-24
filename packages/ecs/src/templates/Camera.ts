import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('Camera', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.services.Camera) {
    entity.addComponent(new Components.CameraComponent(options))
  }
})

import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('WASD', (entity: Entity, options: any = {}) => {
  entity.root.applyTemplate('Mouse')
  entity.root.applyTemplate('Keyboard')
  entity.applyTemplate('Transform')
  entity.addComponent(new Components.WASDComponent())
})

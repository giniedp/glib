import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('Keyboard', (entity: Entity, options: any = {}) => {
  if (!entity.s.Keyboard) {
    entity.addComponent(new Components.KeyboardComponent(options))
  }
})

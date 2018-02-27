import * as Components from '../components'
import { Entity } from '../Entity'
import { addTemplate } from '../Template'

addTemplate('Mouse', (entity: Entity, options: any = {}) => {
  if (!entity.s.Mouse) {
    entity.addComponent(new Components.MouseComponent(options))
  }
})

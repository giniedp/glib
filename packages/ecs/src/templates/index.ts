import './Camera'
import './DirectionalLight'
import './Game'
import './Keyboard'
import './Light'
import './Model'
import './Mouse'
import './PointLight'
import './SpotLight'
import './Transform'
import './WASD'

import { Entity } from '../Entity'

export function createGame(options: any, ...tpl: string[]) {
  return new Entity().applyTemplate('Game', options).applyTemplates(tpl)
}

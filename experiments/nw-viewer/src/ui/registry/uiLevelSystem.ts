import type { FactoryComponent } from 'mithril'

import type { LevelSystem } from '../../game/level/LevelSystem'
import icon from '../icons/network-wired.svg?raw'
import { type UiAnnotation } from './types'

export const LevelSystemProps: FactoryComponent<{ data: LevelSystem }> = () => {
  return {
    view({ attrs: { data } }) {
      return null
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'LevelSystem',
  propsComponent: LevelSystemProps,
  expandable: () => true,
  children: (it: LevelSystem) => {
    return (function* () {
      yield it.timeOfDay
    })()
  },
} satisfies UiAnnotation<LevelSystem>

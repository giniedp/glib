import type { GameWorld } from '@gglib/ecs'
import type { FactoryComponent } from 'mithril'
import icon from '../icons/globe.svg?raw'
import { type UiAnnotation } from './types'

export const GameWorldProps: FactoryComponent<{ data: GameWorld }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }

      return []
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'GameWorld',
  propsComponent: GameWorldProps,
  expandable: () => true,
  children: (it: GameWorld) => {
    return (function* () {
      for (const item of it.systems) {
        yield item
      }
    })()
  },
} satisfies UiAnnotation<GameWorld>

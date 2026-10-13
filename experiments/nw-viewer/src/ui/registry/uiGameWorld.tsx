import type { GameWorld } from '@gglib/ecs'
import icon from '../icons/globe.svg?raw'
import { type UiAnnotation } from './types'

export function GameWorldProps(props: { data: GameWorld }) {
  return null
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

import type { GameSystem } from '@gglib/ecs'
import type { FactoryComponent } from 'mithril'
import { uiBoolWidget } from 'tweak-ui'
import icon from '../icons/network-wired.svg?raw'
import { type UiAnnotation } from './types'

export const GameSystemProps: FactoryComponent<{ data: GameSystem }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }

      return [
        uiBoolWidget({
          label: 'Updatable',
          value: !!data.update,
          readonly: true,
          align: 'start',
        }),
        uiBoolWidget({
          label: 'Renderable',
          value: !!data.render,
          readonly: true,
          align: 'start',
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'GameSystem',
  propsComponent: GameSystemProps,
} satisfies UiAnnotation<GameSystem>

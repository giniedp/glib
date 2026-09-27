import type { GameLoop } from '@gglib/game'
import type { FactoryComponent } from 'mithril'
import { uiBoolWidget } from 'tweak-ui'
import type { LightSystem } from '../../game/light/LightSystem'
import icon from '../icons/timer.svg?raw'
import { type UiAnnotation } from './types'

export const LightSystemProps: FactoryComponent<{ data: LightSystem }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }

      return [
        uiBoolWidget({
          value: data,
          field: 'enabled',
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'Light System',
  propsComponent: LightSystemProps,
} satisfies UiAnnotation<GameLoop>

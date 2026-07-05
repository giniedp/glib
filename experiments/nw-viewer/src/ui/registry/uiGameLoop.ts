import type { GameLoop } from '@gglib/components'
import type { FactoryComponent } from 'mithril'
import { uiBoolWidget, uiScalarWidget } from 'tweak-ui'
import icon from '../icons/timer.svg?raw'
import { type UiAnnotation } from './types'

export const GameLoopProps: FactoryComponent<{ data: GameLoop }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }

      return [
        uiBoolWidget({
          value: data,
          field: 'isRunning',
          readonly: true,
        }),
        uiBoolWidget({
          value: data,
          field: 'isRunningSlowly',
          readonly: true,
        }),
        uiBoolWidget({
          label: 'Fixed time step',
          value: data,
          field: 'useFixedTimeStep',
        }),
        data.useFixedTimeStep
          ? uiScalarWidget({
              label: 'Target FPS',
              get value() {
                return 1000 / data.targetElapsedTime
              },
              set value(fps: number) {
                data.targetElapsedTime = 1000 / fps
              },
              min: 10,
              max: 200,
              step: 1,
              range: true,
            })
          : null,
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'GameLoop',
  propsComponent: GameLoopProps,
} satisfies UiAnnotation<GameLoop>

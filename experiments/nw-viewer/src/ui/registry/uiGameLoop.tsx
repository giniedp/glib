import type { GameLoop } from '@gglib/game'
import { Show } from 'solid-js'
import { BoolWidget, ScalarWidget } from 'tweak-ui'
import icon from '../icons/timer.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

export function GameLoopProps(props: { data: GameLoop }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <BoolWidget {...panel.bind(data, 'isRunning')} readonly />
          <BoolWidget {...panel.bind(data, 'isRunningSlowly')} readonly />
          <BoolWidget {...panel.bind(data, 'useFixedTimeStep')} label="Fixed time step" />
          <Show when={panel.pull(() => data.useFixedTimeStep)}>
            <ScalarWidget
              label="Target FPS"
              value={panel.pull(() => 1000 / data.targetElapsedTime)}
              onInput={(fps) => {
                data.targetElapsedTime = 1000 / fps
                panel.redraw()
              }}
              min={10}
              max={200}
              step={1}
              range
            />
          </Show>
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'GameLoop',
  propsComponent: GameLoopProps,
} satisfies UiAnnotation<GameLoop>

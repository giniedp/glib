import { Show } from 'solid-js'
import { SelectWidget, TextWidget, track } from 'tweak-ui'
import type { MovementMode, PlayerMovementComponent } from '../../game/player/PlayerMovementComponent'
import icon from '../icons/gamepad.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

const modes: Array<{ value: MovementMode; label: string }> = [
  { value: 'free', label: 'Free (fly)' },
  { value: 'grounded', label: 'Grounded (walk)' },
]

export function PlayerMovementComponentProps(props: { data: PlayerMovementComponent }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => {
        // the mode also changes with the G key
        const mode = track(() => panel.pull(() => data.mode), { interval: 250 })
        return (
          <>
            <SelectWidget
              label="Mode"
              value={mode()}
              options={modes}
              onInput={(value: MovementMode) => {
                data.mode = value
                panel.redraw()
              }}
            />
            <Show when={!panel.pull(() => data.canWalk)}>
              <TextWidget label="Note" value="grounded needs cross origin isolation" readonly />
            </Show>
          </>
        )
      }}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'PlayerMovementComponent',
  propsComponent: PlayerMovementComponentProps,
} satisfies UiAnnotation<PlayerMovementComponent>

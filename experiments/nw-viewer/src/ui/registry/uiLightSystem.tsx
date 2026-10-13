import { Show } from 'solid-js'
import { BoolWidget } from 'tweak-ui'
import type { LightSystem } from '../../game/light/LightSystem'
import icon from '../icons/timer.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

export function LightSystemProps(props: { data: LightSystem }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => <BoolWidget {...panel.bind(data, 'enabled')} />}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'Light System',
  propsComponent: LightSystemProps,
} satisfies UiAnnotation<LightSystem>

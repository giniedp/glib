import { Show } from 'solid-js'
import { BitmaskWidget } from 'tweak-ui'
import { DebugLayer } from '../../game/debug/DebugShapeComponent'
import type { DebugShapeSystem } from '../../game/debug/DebugShapeSystem'
import icon from '../icons/network-wired.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

export function DebugShapeSystemProps(props: { data: DebugShapeSystem }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <BitmaskWidget
          {...panel.bind(data, 'activeLayers')}
          label="Debug Layers"
          bits={DebugLayer}
          bitCount={Object.values(DebugLayer).length}
        />
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'DebugShapeSystem',
  propsComponent: DebugShapeSystemProps,
} satisfies UiAnnotation<DebugShapeSystem>

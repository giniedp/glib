import { For, Show } from 'solid-js'
import { PollWidget } from 'tweak-ui'
import { DebugLayer, type DebugShapeComponent } from '../../game/debug/DebugShapeComponent'
import icon from '../icons/network-wired.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

function layerName(layer: DebugLayer) {
  const names = Object.entries(DebugLayer)
    .filter(([, value]) => (layer & value) !== 0)
    .map(([name]) => name)
  return names.join(' | ') || '-'
}

export function DebugShapeComponentProps(props: { data: DebugShapeComponent }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <For each={panel.pull(() => [...data.entries])}>
            {(entry, i) => (
              <PollWidget
                label={`shape ${i()}`}
                value={`${entry.type} ${layerName(entry.layer)} (${entry.transforms?.length ?? 0})`}
              />
            )}
          </For>
          <For each={panel.pull(() => [...data.info])}>
            {(info) => <PollWidget label={info.label} value={info.get() ?? '-'} />}
          </For>
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'DebugShapeComponent',
  propsComponent: DebugShapeComponentProps,
} satisfies UiAnnotation<DebugShapeComponent>

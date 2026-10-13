import { BoundingSphere } from '@gglib/math'
import { Show } from 'solid-js'
import { BoolWidget, ScalarWidget, VectorWidget } from 'tweak-ui'
import icon from '../icons/circle.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

export function BoundingSphereProps(props: { data: BoundingSphere }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <BoolWidget {...panel.bind(data, 'isEmpty')} readonly />
          <VectorWidget label="center" value={panel.pull(() => data.center)} readonly />
          <ScalarWidget {...panel.bind(data, 'radius')} readonly />
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'BoundingSphere',
  propsComponent: BoundingSphereProps,
} satisfies UiAnnotation<BoundingSphere>

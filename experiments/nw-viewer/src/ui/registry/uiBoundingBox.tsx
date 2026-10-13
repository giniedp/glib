import { BoundingBox } from '@gglib/math'
import { Show } from 'solid-js'
import { BoolWidget, VectorWidget } from 'tweak-ui'
import icon from '../icons/cube.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

export function BoundingBoxProps(props: { data: BoundingBox }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <BoolWidget {...panel.bind(data, 'isEmpty')} readonly />
          <VectorWidget label="min" value={panel.pull(() => data.min)} readonly />
          <VectorWidget label="max" value={panel.pull(() => data.max)} readonly />
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'BoundingBox',
  propsComponent: BoundingBoxProps,
} satisfies UiAnnotation<BoundingBox>

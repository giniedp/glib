import type { Geometry } from '@gglib/graphics'
import { Show } from 'solid-js'
import { ScalarWidget, TextWidget } from 'tweak-ui'
import icon from '../icons/triangle.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

export function GeometryProps(props: { data: Geometry }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <TextWidget {...panel.bind(data, 'name')} readonly />
          <TextWidget {...panel.bind(data, 'uid')} readonly />
          <ScalarWidget {...panel.bind(data, 'vertexCount')} readonly decimals={0} />
          <ScalarWidget {...panel.bind(data, 'vertexOffset')} readonly decimals={0} />
          <ScalarWidget {...panel.bind(data, 'indexCount')} readonly decimals={0} />
          <ScalarWidget {...panel.bind(data, 'indexOffset')} readonly decimals={0} />
          <ScalarWidget {...panel.bind(data, 'instanceOffset')} readonly decimals={0} />
          <ScalarWidget {...panel.bind(data, 'instanceCount')} readonly decimals={0} />
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'Geometry',
  propsComponent: GeometryProps,
} satisfies UiAnnotation<Geometry>

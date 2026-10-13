import type { TransformComponent } from '@gglib/components'
import { Show } from 'solid-js'
import { BoolWidget, MatrixWidget, ScalarWidget } from 'tweak-ui'
import icon from '../icons/cube.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

export function TransformComponentProps(props: { data: TransformComponent }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <ScalarWidget label="Children" value={panel.pull(() => data.children?.length)} readonly decimals={0} />
          <BoolWidget {...panel.bind(data, 'keepWorld')} readonly />
          <MatrixWidget label="Transform" value={panel.pull(() => data.matrix)} rows={4} cols={4} readonly />
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'TransformComponent',
  propsComponent: TransformComponentProps,
} satisfies UiAnnotation<TransformComponent>

import type { ModelComponent } from '@gglib/components'
import icon from '../icons/cubes-stacked.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'
import { ModelProps } from './uiModel'

export function ModelComponentProps(props: { data: ModelComponent }) {
  const panel = usePanel()
  return <ModelProps data={panel.pull(() => props.data?.model)} />
}

export default {
  icon: () => icon,
  label: () => 'ModelComponent',
  propsComponent: ModelComponentProps,
  expandable: (it) => !!it.model,
  children: (it) => {
    return (function* () {
      yield it.model
    })()
  },
} satisfies UiAnnotation<ModelComponent>

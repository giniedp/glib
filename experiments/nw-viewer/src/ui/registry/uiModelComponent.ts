import type { ModelComponent } from '@gglib/components'
import type { FactoryComponent } from 'mithril'
import { h } from 'tweak-ui'
import icon from '../icons/cubes-stacked.svg?raw'
import { type UiAnnotation } from './types'
import { ModelProps } from './uiModel'

export const ModelComponentProps: FactoryComponent<{ data: ModelComponent }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data?.model) {
        return null
      }
      const model = data.model
      return [h(ModelProps, { data: model })]
    },
  }
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

import type { TransformComponent } from '@gglib/components'
import type { FactoryComponent } from 'mithril'
import { uiBoolWidget, uiMatrixWidget, uiScalarWidget, uiStringWidget } from 'tweak-ui'
import icon from '../icons/cube.svg?raw'
import { type UiAnnotation } from './types'

export const TransformComponentProps: FactoryComponent<{ data: TransformComponent }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }

      return [
        uiScalarWidget({
          readonly: true,
          label: 'Children',
          value: data,
          binding: {
            get: (it) => it.children?.length,
          },
        }),
        uiBoolWidget({
          readonly: true,
          value: data,
          field: 'keepWorld',
        }),
        uiMatrixWidget({
          label: 'Transform',
          value: data.matrix,
          field: 'elements',
          rows: 4,
          cols: 4,
          readonly: true,
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'TransformComponent',
  propsComponent: TransformComponentProps,
} satisfies UiAnnotation<TransformComponent>

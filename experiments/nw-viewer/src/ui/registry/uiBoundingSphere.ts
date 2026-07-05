import { BoundingSphere } from '@gglib/math'
import type { FactoryComponent } from 'mithril'
import { uiBoolWidget, uiScalarWidget, uiVectorWidget } from 'tweak-ui'
import icon from '../icons/circle.svg?raw'
import { type UiAnnotation } from './types'

export const BoundingSphereProps: FactoryComponent<{ data: BoundingSphere }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      return [
        uiBoolWidget({
          value: data,
          field: 'isEmpty',
          readonly: true,
        }),
        uiVectorWidget({
          value: data,
          field: 'center',
          readonly: true,
        }),
        uiScalarWidget({
          value: data,
          field: 'radius',
          readonly: true,
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'BoundingSphere',
  propsComponent: BoundingSphereProps,
} satisfies UiAnnotation<BoundingSphere>

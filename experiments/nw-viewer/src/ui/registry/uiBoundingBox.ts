import { BoundingBox } from '@gglib/math'
import type { FactoryComponent } from 'mithril'
import { uiBoolWidget, uiVectorWidget } from 'tweak-ui'
import icon from '../icons/cube.svg?raw'
import { type UiAnnotation } from './types'

export const BoundingBoxProps: FactoryComponent<{ data: BoundingBox }> = () => {
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
          field: 'min',
          readonly: true,
        }),
        uiVectorWidget({
          value: data,
          field: 'max',
          readonly: true,
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'BoundingBox',
  propsComponent: BoundingBoxProps,
} satisfies UiAnnotation<BoundingBox>

import type { Geometry } from '@gglib/graphics'
import type { FactoryComponent } from 'mithril'
import { uiScalarWidget, uiStringWidget } from 'tweak-ui'
import icon from '../icons/triangle.svg?raw'
import { type UiAnnotation } from './types'

export const GeometryProps: FactoryComponent<{ data: Geometry }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }

      return [
        uiStringWidget({
          readonly: true,
          value: data,
          field: 'name',
        }),
        uiStringWidget({
          readonly: true,
          value: data,
          field: 'uid',
        }),
        uiScalarWidget({
          readonly: true,
          value: data,
          field: 'vertexCount',
        }),
        uiScalarWidget({
          readonly: true,
          value: data,
          field: 'vertexOffset',
        }),
        uiScalarWidget({
          readonly: true,
          value: data,
          field: 'indexCount',
        }),
        uiScalarWidget({
          readonly: true,
          value: data,
          field: 'indexOffset',
        }),
        uiScalarWidget({
          readonly: true,
          value: data,
          field: 'instanceOffset',
        }),
        uiScalarWidget({
          readonly: true,
          value: data,
          field: 'instanceCount',
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'Geometry',
  propsComponent: GeometryProps,
} satisfies UiAnnotation<Geometry>

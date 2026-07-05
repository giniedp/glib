import type { CameraComponent } from '@gglib/components'
import type { FactoryComponent } from 'mithril'
import { uiAngleWidget, uiBitmaskWidget, uiBoolWidget, uiScalarWidget, uiSelect } from 'tweak-ui'

import { MaterialLayerMasks } from '../../material'
import icon from '../icons/camera.svg?raw'
import { type UiAnnotation } from './types'

export const CameraComponentProps: FactoryComponent<{ data: CameraComponent }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }

      return [
        uiScalarWidget({
          value: data,
          field: 'near',
          min: 0.01,
          max: 1,
          step: 0.01,
          range: true,
        }),
        uiScalarWidget({
          value: data,
          field: 'far',
          min: 2,
          max: 4000,
          step: 1,
          range: true,
        }),
        uiBoolWidget({
          value: data,
          field: 'reversedZ',
        }),
        uiSelect({
          value: data,
          field: 'type',
          options: [
            { value: 'perspective', label: 'Perspective' },
            { value: 'orthographic', label: 'Orthographic' },
          ],
        }),
        data.type === 'perspective'
          ? uiAngleWidget({
              label: 'FOV',
              value: data,
              field: 'perspectiveFov',
              min: 1,
              max: 179,
              step: 1,
            })
          : null,
        data.type === 'orthographic'
          ? uiScalarWidget({
              label: 'Scale',
              value: data,
              field: 'orthographicScale',
              min: 1,
              max: window.innerWidth,
              step: 1,
              range: true,
            })
          : null,
        uiBitmaskWidget({
          label: 'Layers',
          value: data,
          field: 'visibilityMask',
          bitCount: Object.keys(MaterialLayerMasks).length,
          names: MaterialLayerMasks,
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'CameraComponent',
  propsComponent: CameraComponentProps,
} satisfies UiAnnotation<CameraComponent>

import type { FactoryComponent } from 'mithril'
import { uiAngleWidget, uiBoolWidget, uiScalarWidget } from 'tweak-ui'
import type { TimeOfDay } from '../../game/level/TimeOfDay'
import icon from '../icons/sun-cloud.svg?raw'
import { type UiAnnotation } from './types'

export const TimeOfDayProps: FactoryComponent<{ data: TimeOfDay }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }

      return [
        uiScalarWidget({
          value: data,
          field: 'time',
          min: 0,
          max: (24 * 60 - 1) / 60.0,
          step: 0.1,
          range: true,
        }),
        uiScalarWidget({
          value: data,
          field: 'timeAnimSpeed',
          min: 0,
          max: 2,
          step: 0.001,
          range: true,
        }),
        uiBoolWidget({
          value: data,
          field: 'enablePoiLayers',
        }),
        uiBoolWidget({
          value: data,
          field: 'animate',
        }),
        uiAngleWidget({
          value: data,
          field: 'sunRotationLatitude',
          min: 0,
          max: 360,
          step: 1,
          degree: true,
        }),
        uiAngleWidget({
          value: data,
          field: 'sunRotationLongitude',
          min: 0,
          max: 360,
          step: 1,
          degree: true,
        }),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'TimeOfDay',
  propsComponent: TimeOfDayProps,
} satisfies UiAnnotation<TimeOfDay>

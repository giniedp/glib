import { Show } from 'solid-js'
import { AngleWidget, BoolWidget, ScalarWidget, track } from 'tweak-ui'
import type { TimeOfDay } from '../../game/level/TimeOfDay'
import icon from '../icons/sun-cloud.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

export function TimeOfDayProps(props: { data: TimeOfDay }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => {
        // advances on its own while animated
        const time = track(() => panel.pull(() => data.time))
        return (
          <>
            <ScalarWidget
              {...panel.bind(data, 'time')}
              value={time()}
              min={0}
              max={(24 * 60 - 1) / 60.0}
              step={0.1}
              range
            />
            <ScalarWidget {...panel.bind(data, 'timeAnimSpeed')} min={0} max={2} step={0.001} range />
            <BoolWidget {...panel.bind(data, 'enablePoiLayers')} />
            <BoolWidget {...panel.bind(data, 'animate')} />
            <AngleWidget {...panel.bind(data, 'sunRotationLatitude')} min={0} max={360} step={1} degree />
            <AngleWidget {...panel.bind(data, 'sunRotationLongitude')} min={0} max={360} step={1} degree />
          </>
        )
      }}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'TimeOfDay',
  propsComponent: TimeOfDayProps,
} satisfies UiAnnotation<TimeOfDay>

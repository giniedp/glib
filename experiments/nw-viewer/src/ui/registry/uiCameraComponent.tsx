import type { CameraComponent } from '@gglib/components'
import { DEGREE_TO_RAD } from '@gglib/math'
import { Show } from 'solid-js'
import { AngleWidget, BitmaskWidget, BoolWidget, ScalarWidget, SelectWidget } from 'tweak-ui'
import { MaterialLayerMasks } from '../../material'
import icon from '../icons/camera.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

const cameraTypes = [
  { value: 'perspective', label: 'Perspective' },
  { value: 'orthographic', label: 'Orthographic' },
] as const

export function CameraComponentProps(props: { data: CameraComponent }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <ScalarWidget {...panel.bind(data, 'near')} min={0.01} max={1} step={0.01} range />
          <ScalarWidget {...panel.bind(data, 'far')} min={2} max={4000} step={1} range />
          <BoolWidget {...panel.bind(data, 'reversedZ')} />
          <SelectWidget {...panel.bind(data, 'type')} options={cameraTypes} />
          <Show when={panel.pull(() => data.type) === 'perspective'}>
            <AngleWidget
              {...panel.bind(data, 'perspectiveFov')}
              label="FOV"
              min={1 * DEGREE_TO_RAD}
              max={180 * DEGREE_TO_RAD}
              step={1 * DEGREE_TO_RAD}
              degree={false}
            />
          </Show>
          <Show when={panel.pull(() => data.type) === 'orthographic'}>
            <ScalarWidget
              {...panel.bind(data, 'orthographicScale')}
              label="Scale"
              min={1}
              max={window.innerWidth}
              step={1}
              range
            />
          </Show>
          <BitmaskWidget
            {...panel.bind(data, 'visibilityMask')}
            label="Layers"
            bitCount={Object.keys(MaterialLayerMasks).length}
            bits={MaterialLayerMasks}
          />
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'CameraComponent',
  propsComponent: CameraComponentProps,
} satisfies UiAnnotation<CameraComponent>

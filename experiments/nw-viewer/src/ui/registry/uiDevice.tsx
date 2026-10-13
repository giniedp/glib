import type { Device, Capabilities } from '@gglib/graphics'
import { For, Show } from 'solid-js'
import { BoolWidget, Group, ScalarWidget, Widget } from 'tweak-ui'
import icon from '../icons/gpu.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'

const limits = [
  'maxTextureCount',
  'maxTextureSize',
  'maxVertexAttributes',
  'maxVertexTextureCount',
  'maxRenderTargets',
  'maxRenderTargetSize',
] as const satisfies ReadonlyArray<keyof Capabilities>

const features = [
  'canRenderR32F',
  'canRenderRG32F',
  'canRenderRGBA32F',
  'canFilterR32F',
  'canFilterRG32F',
  'canFilterRGBA32F',
  'canRenderR16F',
  'canRenderRG16F',
  'canRenderRGBA16F',
  'canFilterR16F',
  'canFilterRG16F',
  'canFilterRGBA16F',
] as const satisfies ReadonlyArray<keyof Capabilities>

const compressions = [
  ['textureCompressionAstc', 'Astc'],
  ['textureCompressionEtc2', 'Etc2'],
  ['textureCompressionEtc1', 'Etc1'],
  ['textureCompressionPvrtc', 'Pvrtc'],
  ['textureCompressionBc', 'Bc'],
  ['textureCompressionBptc', 'Bptc'],
] as const satisfies ReadonlyArray<readonly [keyof Capabilities, string]>

export function DeviceProps(props: { data: Device }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => (
        <>
          <ScalarWidget label="ndcMinZ" value={data.ndcMinZ} readonly decimals={0} />
          <Widget label="Backend">{data.isWebGPU ? 'WebGPU' : 'WebGL'}</Widget>
          <Group title="Capabilities">
            <For each={limits}>
              {(key) => <ScalarWidget {...panel.bind(data.capabilities, key)} readonly decimals={0} />}
            </For>
            <For each={features}>{(key) => <BoolWidget {...panel.bind(data.capabilities, key)} readonly />}</For>
            <For each={compressions}>
              {([key, label]) => <BoolWidget {...panel.bind(data.capabilities, key)} label={label} readonly />}
            </For>
          </Group>
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'Device',
  propsComponent: DeviceProps,
} satisfies UiAnnotation<Device>

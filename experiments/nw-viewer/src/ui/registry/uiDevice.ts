import type { Device } from '@gglib/graphics'
import type { FactoryComponent } from 'mithril'
import { uiBoolWidget, uiGroup, uiScalarWidget, uiWidget } from 'tweak-ui'
import icon from '../icons/gpu.svg?raw'
import { type UiAnnotation } from './types'

export const DeviceProps: FactoryComponent<{ data: Device }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      const capabilities = data.capabilities

      return [
        uiScalarWidget({
          value: data,
          field: 'ndcMinZ',
          readonly: true,
        }),
        uiWidget({ label: 'Backend' }, [data.isWebGPU ? 'WebGPU' : 'WebGL']),
        uiGroup({ title: 'Capabilities' }, [
          uiScalarWidget({ value: capabilities, field: 'maxTextureCount', readonly: true }),
          uiScalarWidget({ value: capabilities, field: 'maxTextureSize', readonly: true }),
          uiScalarWidget({
            value: capabilities,
            field: 'maxVertexAttributes',
            readonly: true,
          }),
          uiScalarWidget({
            value: capabilities,
            field: 'maxVertexTextureCount',
            readonly: true,
          }),
          uiScalarWidget({
            value: capabilities,
            field: 'maxRenderTargets',
            readonly: true,
          }),
          uiScalarWidget({
            value: capabilities,
            field: 'maxRenderTargetSize',
            readonly: true,
          }),

          uiBoolWidget({
            value: capabilities,
            field: 'canRenderR32F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canRenderRG32F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canRenderRGBA32F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canFilterR32F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canFilterRG32F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canFilterRGBA32F',
            readonly: true,
          }),

          uiBoolWidget({
            value: capabilities,
            field: 'canRenderR16F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canRenderRG16F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canRenderRGBA16F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canFilterR16F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canFilterRG16F',
            readonly: true,
          }),
          uiBoolWidget({
            value: capabilities,
            field: 'canFilterRGBA16F',
            readonly: true,
          }),

          uiBoolWidget({ value: capabilities, field: 'textureCompressionAstc', label: 'Astc', readonly: true }),
          uiBoolWidget({ value: capabilities, field: 'textureCompressionEtc2', label: 'Etc2', readonly: true }),
          uiBoolWidget({ value: capabilities, field: 'textureCompressionEtc1', label: 'Etc1', readonly: true }),
          uiBoolWidget({ value: capabilities, field: 'textureCompressionPvrtc', label: 'Pvrtc', readonly: true }),
          uiBoolWidget({ value: capabilities, field: 'textureCompressionBc', label: 'Bc', readonly: true }),
          uiBoolWidget({ value: capabilities, field: 'textureCompressionBptc', label: 'Bptc', readonly: true }),
        ]),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'Device',
  propsComponent: DeviceProps,
} satisfies UiAnnotation<Device>

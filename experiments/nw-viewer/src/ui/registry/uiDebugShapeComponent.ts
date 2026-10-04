import type { FactoryComponent } from 'mithril'
import { uiPollWidget } from 'tweak-ui'
import { DebugLayer, type DebugShapeComponent } from '../../game/debug/DebugShapeComponent'
import icon from '../icons/network-wired.svg?raw'
import { type UiAnnotation } from './types'

function layerName(layer: DebugLayer) {
  const names = Object.entries(DebugLayer)
    .filter(([, value]) => (layer & value) !== 0)
    .map(([name]) => name)
  return names.join(' | ') || '-'
}

export const DebugShapeComponentProps: FactoryComponent<{ data: DebugShapeComponent }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      return [
        ...data.entries.map((entry, i) =>
          uiPollWidget({
            label: `shape ${i}`,
            value: entry,
            binding: {
              get: (it) => `${it.type} ${layerName(it.layer)} (${it.transforms?.length ?? 0})`,
            },
          }),
        ),
        ...data.info.map((info) =>
          uiPollWidget({
            label: info.label,
            value: info,
            binding: {
              get: (it) => {
                const value = it.get()
                return value == null ? '-' : value
              },
            },
          }),
        ),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'DebugShapeComponent',
  propsComponent: DebugShapeComponentProps,
} satisfies UiAnnotation<DebugShapeComponent>

import type { FactoryComponent } from 'mithril'
import { uiBitmaskWidget } from 'tweak-ui'
import type { DebugShapeSystem } from '../../game/debug/DebugShapeSystem'
import icon from '../icons/network-wired.svg?raw'
import { type UiAnnotation } from './types'
import { DebugLayer } from '../../game/debug/DebugShapeComponent'

export const DebugShapeSystemProps: FactoryComponent<{ data: DebugShapeSystem }> = () => {
  return {
    view({ attrs: { data } }) {
      return uiBitmaskWidget({
        label: 'Debug Layers',
        value: data,
        field: 'activeLayers',
        names: DebugLayer,
        bitCount: Object.values(DebugLayer).length,
      })
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'DebugShapeSystem',
  propsComponent: DebugShapeSystemProps,
} satisfies UiAnnotation<DebugShapeSystem>

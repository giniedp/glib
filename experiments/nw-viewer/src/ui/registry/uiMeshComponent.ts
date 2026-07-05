import type { MeshComponent } from '@gglib/components'
import type { FactoryComponent } from 'mithril'
import { h } from 'tweak-ui'
import icon from '../icons/hexagon-nodes.svg?raw'
import { type UiAnnotation } from './types'
import { MeshProps } from './uiMesh'

export const MeshComponentProps: FactoryComponent<{ data: MeshComponent }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data?.mesh) {
        return null
      }
      const mesh = data.mesh

      return [h(MeshProps, { data: mesh })]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'MeshComponent',
  propsComponent: MeshComponentProps,
  expandable: (it) => !!it.mesh,
  children: (it) => {
    return (function* () {
      yield it.mesh
    })()
  },
} satisfies UiAnnotation<MeshComponent>

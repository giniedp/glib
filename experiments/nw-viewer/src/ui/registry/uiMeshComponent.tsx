import type { MeshComponent } from '@gglib/components'
import icon from '../icons/hexagon-nodes.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'
import { MeshProps } from './uiMesh'

export function MeshComponentProps(props: { data: MeshComponent }) {
  const panel = usePanel()
  return <MeshProps data={panel.pull(() => props.data?.mesh)} />
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

import type { Mesh } from '@gglib/graphics'
import { Show } from 'solid-js'
import { Group, TextWidget } from 'tweak-ui'
import icon from '../icons/hexagon-nodes.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'
import { BoundingBoxProps } from './uiBoundingBox'
import { BoundingSphereProps } from './uiBoundingSphere'

export function MeshProps(props: { data: Mesh }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(mesh) => (
        <>
          <TextWidget {...panel.bind(mesh, 'name')} label="Name" readonly />
          <TextWidget label="Bone ID" value={panel.pull(() => String(mesh.boneId))} readonly />
          <TextWidget label="Materials" value={panel.pull(() => String(mesh.materials?.length ?? 0))} readonly />
          <TextWidget label="Geometries" value={panel.pull(() => String(mesh.geometries?.length ?? 0))} readonly />
          <Group title="Bounding Box">
            <BoundingBoxProps data={panel.pull(() => mesh.boundingBox)} />
          </Group>
          <Group title="Bounding Sphere">
            <BoundingSphereProps data={panel.pull(() => mesh.boundingSphere)} />
          </Group>
        </>
      )}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: () => 'Mesh',
  propsComponent: MeshProps,
  expandable: (it) => true,
  children: (it) => {
    return (function* () {
      if (it.boundingBox) {
        yield it.boundingBox
      }
      if (it.boundingSphere) {
        yield it.boundingSphere
      }
      for (const item of it.materials) {
        yield item
      }
      for (const item of it.geometries) {
        yield item
      }
    })()
  },
} satisfies UiAnnotation<Mesh>

import type { Mesh } from '@gglib/graphics'
import type { FactoryComponent } from 'mithril'
import { h, uiGroup, uiStringWidget } from 'tweak-ui'
import icon from '../icons/hexagon-nodes.svg?raw'
import { type UiAnnotation } from './types'
import { BoundingBoxProps } from './uiBoundingBox'
import { BoundingSphereProps } from './uiBoundingSphere'

export const MeshProps: FactoryComponent<{ data: Mesh }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      const mesh = data

      return [
        uiStringWidget({
          label: 'Name',
          readonly: true,
          value: mesh,
          field: 'name',
        }),
        uiStringWidget({
          label: 'Bone ID',
          readonly: true,
          value: mesh,
          field: 'boneId',
        }),
        uiStringWidget({
          label: 'Materials',
          readonly: true,
          value: mesh,
          binding: {
            get: () => String(mesh.materials?.length ?? 0),
          },
        }),
        uiStringWidget({
          label: 'Geometries',
          readonly: true,
          value: mesh,
          binding: {
            get: () => String(mesh.geometries?.length ?? 0),
          },
        }),
        uiGroup({ title: 'Bounding Box' }, [h(BoundingBoxProps, { data: mesh.boundingBox })]),
        uiGroup({ title: 'Bounding Sphere' }, [h(BoundingSphereProps, { data: mesh.boundingSphere })]),
      ]
    },
  }
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

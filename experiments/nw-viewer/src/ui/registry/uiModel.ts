import type { Model } from '@gglib/model'
import type { FactoryComponent } from 'mithril'
import { h, uiGroup, uiStringWidget } from 'tweak-ui'
import icon from '../icons/cubes-stacked.svg?raw'
import { type UiAnnotation } from './types'
import { BoundingBoxProps } from './uiBoundingBox'
import { BoundingSphereProps } from './uiBoundingSphere'

export const ModelProps: FactoryComponent<{ data: Model }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      const model = data
      return [
        uiStringWidget({
          readonly: true,
          value: model,
          field: 'name',
        }),
        uiStringWidget({
          label: 'Meshes',
          readonly: true,
          value: model,
          binding: {
            get: (it) => String(it.meshes?.length ?? 0),
          },
        }),
        uiStringWidget({
          label: 'Nodes',
          readonly: true,
          value: model,
          binding: {
            get: (it) => String(it.nodes?.length ?? 0),
          },
        }),
        uiStringWidget({
          label: 'Skins',
          readonly: true,
          value: model,
          binding: {
            get: (it) => String(it.skins?.length ?? 0),
          },
        }),

        uiGroup({ title: 'Bounding Box' }, [h(BoundingBoxProps, { data: model.boundingBox })]),
        uiGroup({ title: 'Bounding Sphere' }, [h(BoundingSphereProps, { data: model.boundingSphere })]),
      ]
    },
  }
}

export default {
  icon: () => icon,
  label: () => 'Model',
  propsComponent: ModelProps,
  expandable: (it) => true,
  children: (it) => {
    return (function* () {
      if (it.boundingBox) {
        yield it.boundingBox
      }
      if (it.boundingSphere) {
        yield it.boundingSphere
      }
      for (const item of it.meshes) {
        yield item
      }
    })()
  },
} satisfies UiAnnotation<Model>

import type { Model } from '@gglib/model'
import { Show } from 'solid-js'
import { Group, TextWidget } from 'tweak-ui'
import icon from '../icons/cubes-stacked.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'
import { BoundingBoxProps } from './uiBoundingBox'
import { BoundingSphereProps } from './uiBoundingSphere'

export function ModelProps(props: { data: Model }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(model) => (
        <>
          <TextWidget {...panel.bind(model, 'name')} readonly />
          <TextWidget label="Meshes" value={panel.pull(() => String(model.meshes?.length ?? 0))} readonly />
          <TextWidget label="Nodes" value={panel.pull(() => String(model.nodes?.length ?? 0))} readonly />
          <TextWidget label="Skins" value={panel.pull(() => String(model.skins?.length ?? 0))} readonly />
          <Group title="Bounding Box">
            <BoundingBoxProps data={panel.pull(() => model.boundingBox)} />
          </Group>
          <Group title="Bounding Sphere">
            <BoundingSphereProps data={panel.pull(() => model.boundingSphere)} />
          </Group>
        </>
      )}
    </Show>
  )
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

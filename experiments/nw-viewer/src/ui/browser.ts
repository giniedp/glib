import { GameEntity } from '@gglib/ecs'
import type { FactoryComponent } from 'mithril'
import { h, uiGroup, uiSection, uiSectionFooter, uiTree } from 'tweak-ui'

import type { NwViewer } from '../viewer'
import type { UiRegistry } from './registry'
import { nwViewerTreAdapter, type NWTreeAdapter } from './tree'
export type NwBrowserProps = {
  viewer: NwViewer
  registry: UiRegistry
  selection?: GameEntity
}

export const NwSceneBrowser: FactoryComponent<NwBrowserProps> = () => {
  let selection: any = null
  let adapter: NWTreeAdapter | null = null
  let viewer: NwViewer | null = null
  function onRaySelection(entity: GameEntity) {
    selection = entity
    adapter.scrollToEntity(entity)
  }
  return {
    oninit({ attrs }) {
      viewer = attrs.viewer
      adapter ||= nwViewerTreAdapter(attrs.registry)
      viewer.onRaySelection.add(onRaySelection)
    },
    onremove() {
      viewer.onRaySelection.remove(onRaySelection)
      viewer = null
    },
    view({ attrs: { viewer, registry } }) {
      adapter ||= nwViewerTreAdapter(registry)
      const scene = viewer.scene
      if (!scene) {
        return h('div.nw-scene-browser', {}, 'No scene')
      }
      return uiSection({}, [
        uiTree({
          adapter,
          data: [scene.world, scene],
          selectedId: selection ? adapter.nodeId(selection) : null,
          onSelect: (node) => {
            selection = node
            console.log('Selected node', node)
          },
        }),
        uiSectionFooter({}, [h(NwNodeView, { data: selection, registry })]),
      ])
    },
  }
}

export type NwNodeViewProps = {
  data: any
  registry: UiRegistry
}

export const NwNodeView: FactoryComponent<NwNodeViewProps> = () => {
  return {
    view({ attrs: { data, registry } }) {
      const meta = data ? registry.get(data.constructor) : null
      return uiGroup(
        {
          title: 'Properties',
          style: {
            maxHeight: '35vh',
            overflow: 'auto',
          },
        },
        meta?.propsComponent ? h(meta.propsComponent, { data }) : null,
      )
    },
  }
}

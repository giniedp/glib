import type { GameEntity } from '@gglib/ecs'
import type { FactoryComponent } from 'mithril'
import { uiTree, h } from 'tweak-ui'
import { nwViewerTreAdapter } from './tree'
import { NwNodeView } from './node-view'
export type NwBrowserProps = {
  scene: GameEntity
}

export const NwSceneBrowser: FactoryComponent<NwBrowserProps> = () => {
  const adapter = nwViewerTreAdapter()
  let selection: any = null
  return {
    oninit() {},
    view({ attrs: { scene } }) {
      if (!scene) {
        return h('div.nw-scene-browser', {}, 'No scene')
      }
      return h('div.nw-scene-browser', {}, [
        uiTree({
          adapter,
          data: [scene.world, scene],
          selectedId: selection ? adapter.getId(selection) : null,
          onSelect: (node) => {
            selection = node
            console.log('Selected node', node)
          },
        }),
        h(NwNodeView, { data: selection }),
      ])
    },
  }
}

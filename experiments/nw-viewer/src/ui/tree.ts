import type { GameEntity } from '@gglib/ecs'
import type { Child } from 'mithril'
import { redrawUi, type TreeController, type TreeDataAdapter } from 'tweak-ui'
import { uiIcon } from './icon'
import svgBlockQuestion from './icons/block-question.svg?raw'
import type { UiRegistry } from './registry'

let nodeId = 0
export interface NWTreeAdapter extends TreeDataAdapter<any> {
  collapseAll(): void
  scrollToEntity(entity: GameEntity): void
}

export function nwViewerTreAdapter(registry: UiRegistry): NWTreeAdapter {
  let nodeMap = new WeakMap<any, VirtualNode>()
  let expandMap = new WeakMap<any, boolean>()
  let version = 0
  let controller: TreeController<any> | null = null

  function getNode(node: any): VirtualNode {
    let vNode = nodeMap.get(node)
    if (vNode) {
      return vNode
    }
    vNode = createNode(node, registry)
    nodeMap.set(node, vNode)
    return vNode
  }

  return {
    get version() {
      return version
    },
    nodeId(node: any): string {
      return getNode(node).id
    },
    nodeLabel(node: any): Child {
      return getNode(node).label
    },
    nodeIcon(node: any): Child {
      return getNode(node).icon
    },
    nodeChildren(node: any): Iterable<any> {
      const n = getNode(node)
      return n.expandable ? n.children : null
    },
    isExpanded(node: any): boolean {
      return expandMap.get(node) ?? false
    },
    setExpanded(node: any, expanded: boolean): void {
      expandMap.set(node, expanded)
      version++
    },
    connect(ctrl) {
      controller = ctrl
    },
    collapseAll(): void {
      expandMap = new WeakMap<any, boolean>()
      version++
    },
    scrollToEntity(entity: GameEntity): void {
      let e = entity
      while (e) {
        expandMap.set(e, true)
        e = e.parent
      }
      version++
      redrawUi()
      setTimeout(() => {
        controller.scrollTo(entity)
      }, 50)
    },
  }
}

interface VirtualNode {
  id: string
  label: string
  icon: Child
  children: Iterable<any>
  data: any
  expandable: boolean
}

function createNode(node: any, registry: UiRegistry): VirtualNode {
  const meta = registry.get(node.constructor)
  const icon = meta?.icon?.(node) ?? svgBlockQuestion
  const label = meta?.label?.(node) ?? node.constructor.name ?? ''
  return {
    id: String(++nodeId),
    label: label,
    icon: uiIcon({ icon }),
    data: node,
    get expandable() {
      return meta?.expandable?.(node)
    },
    get children() {
      return meta?.children?.(node)
    },
  }
}

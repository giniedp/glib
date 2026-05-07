import { TransformComponent } from '@gglib/components'
import { GameEntity, GameSystem, GameWorld } from '@gglib/ecs'
import type { Child } from 'mithril'
import { type TreeDataAdapter, h } from 'tweak-ui'
import svgBlockQuestion from './icons/block-question.svg?raw'
import svgCube from './icons/cube.svg?raw'
import svgDolly from './icons/dolly.svg?raw'
import svgNetwork from './icons/network-wired.svg?raw'

export function nwViewerTreAdapter(): TreeDataAdapter<any> {
  let nodeMap = new WeakMap<any, VirtualNode>()
  let nodeId = 0
  function getNode(node: any): VirtualNode {
    let vNode = nodeMap.get(node)
    if (vNode) {
      return vNode
    }

    if ('tweakUi' in node) {
    }
    if (node instanceof GameEntity) {
      vNode = createEntityNode(String(++nodeId), node)
    } else if (node instanceof GameWorld) {
      vNode = createGameWorldNode(String(++nodeId), node)
    } else if (node instanceof GameSystem) {
      vNode = createGameSystemNode(String(++nodeId), node)
    } else {
      vNode = createDefaultNode(String(++nodeId), node)
    }
    nodeMap.set(node, vNode)
    return vNode
  }

  return {
    getId(node: any): string {
      return getNode(node).id
    },
    getLabel(node: any): Child {
      return getNode(node).label
    },
    getIcon(node: any): Child {
      return getNode(node).icon
    },
    getChildren(node: any): Iterable<any> {
      return getNode(node).children || []
    },
    isExpandable(node: any): boolean {
      return !!getNode(node).expandable
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

function createEntityNode(id: string, entity: GameEntity): VirtualNode {
  return {
    id: id,
    label: entity.name || `(unnamed entity)`,
    icon: h(iconComponent, { icon: svgCube }),
    data: entity,
    get expandable() {
      return true
    },
    get children() {
      return (function* () {
        for (const comp of entity.activeComponents) {
          yield comp
        }
        for (const child of entity.getTransform().children) {
          yield child.entity
        }
      })()
    },
  }
}

function createGameSystemNode(id: string, system: GameSystem): VirtualNode {
  return {
    id,
    label: system.constructor.name || '(anonymous system)',
    icon: h(iconComponent, { icon: svgNetwork }),
    data: system,
    get expandable() {
      return false
    },
    get children() {
      return []
    },
  }
}

function createGameWorldNode(id: string, world: GameWorld): VirtualNode {
  return {
    id,
    label: 'Systems',
    icon: h(iconComponent, { icon: svgNetwork }),
    data: world,
    get expandable() {
      return true
    },
    get children() {
      return (function* () {
        for (const comp of world.systems) {
          yield comp
        }
      })()
    },
  }
}

function createDefaultNode(id: string, data: any): VirtualNode {
  return {
    id,
    label: data.constructor.name || '(anonymous component)',
    icon: h.trust(getDefaultIcon(data)),
    data: data,
    get expandable() {
      return false
    },
    get children() {
      return []
    },
  }
}

function getDefaultIcon(data: any): string {
  if (data instanceof TransformComponent) {
    return svgDolly
  }
  return svgBlockQuestion
}

const iconComponent = () => {
  return {
    view(node: any) {
      return h.trust(node.attrs.icon)
    },
  }
}

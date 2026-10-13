import type { GameEntity } from '@gglib/ecs'
import { createSignal } from 'solid-js'
import { Icon, type TreeController, type TreeProps } from 'tweak-ui'
import svgBlockQuestion from './icons/block-question.svg?raw'
import type { UiRegistry } from './registry'

let nodeId = 0

/**
 * The scene tree state: node ids, labels, icons and children from the {@link UiRegistry},
 * the expanded nodes and scrolling to an entity.
 *
 * @remarks
 * Spread the props into a `Tree`: `<Tree items={roots} {...tree.props} />`
 */
export function createSceneTree(registry: UiRegistry) {
  const ids = new WeakMap<object, string>()
  const [expanded, setExpanded] = createSignal<ReadonlySet<string>>(new Set())
  let controller: TreeController | null = null

  function getId(node: any): string {
    let id = ids.get(node)
    if (!id) {
      id = String(++nodeId)
      ids.set(node, id)
    }
    return id
  }

  const props = {
    getId,
    getLabel: (node: any) => registry.get(node.constructor)?.label?.(node) ?? node.constructor.name ?? '',
    getIcon: (node: any) => <Icon svg={registry.get(node.constructor)?.icon?.(node) ?? svgBlockQuestion} />,
    getChildren: (node: any) => {
      const meta = registry.get(node.constructor)
      return meta?.expandable?.(node) ? meta.children?.(node) : null
    },
    get expanded() {
      return expanded()
    },
    onExpandedChange: setExpanded,
    controller: (it: TreeController) => (controller = it),
  } satisfies Omit<TreeProps<any>, 'items'>

  return {
    props,
    getId,
    collapseAll() {
      setExpanded(new Set<string>())
    },
    /**
     * Expands the given nodes, keeps the other expanded nodes
     */
    expand(...nodes: object[]) {
      setExpanded(new Set([...expanded(), ...nodes.map(getId)]))
    },
    /**
     * Expands the parents of the entity and scrolls it into view
     */
    scrollToEntity(entity: GameEntity) {
      const next = new Set(expanded())
      for (let e = entity.parent; e; e = e.parent) {
        next.add(getId(e))
      }
      setExpanded(next)
      // after the tree has rendered the expanded rows
      setTimeout(() => controller?.scrollTo(getId(entity)), 50)
    },
  }
}

export type SceneTree = ReturnType<typeof createSceneTree>

import type { GameEntity } from '@gglib/ecs'
import { createEffect, createSignal, on, onCleanup, Show } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { createInterval, Group, track, Tree } from 'tweak-ui'
import type { NwViewer } from '../../viewer'
import type { UiRegistry } from '../registry'
import { createSceneTree } from '../tree'

export type NwBrowserProps = {
  viewer: NwViewer
  registry: UiRegistry
}

/**
 * The scene tree with the properties of the selected node below.
 * A ray selection in the viewport selects the entity and scrolls it into view.
 */
export function NwSceneBrowser(props: NwBrowserProps) {
  const tree = createSceneTree(props.registry)
  const [selection, setSelection] = createSignal<object | null>(null)

  const onRaySelection = (entity: GameEntity) => {
    setSelection(entity)
    tree.scrollToEntity(entity)
  }
  // the scene is created when the engine initializes
  const scene = track(() => props.viewer.scene, { interval: 500, equals: (a, b) => a === b })
  const treeVersion = createInterval(1000)
  // the top level nodes start expanded
  createEffect(on(scene, (it) => it && tree.expand(props.viewer.world, it.entity)))
  props.viewer.onRaySelection.add(onRaySelection)
  onCleanup(() => props.viewer.onRaySelection.remove(onRaySelection))

  return (
    <Show when={scene()} fallback={<div class="nw-scene-browser">No scene</div>}>
      {(scene) => (
        <div class="nw-scene-browser">
          <Tree
            {...tree.props}
            items={[props.viewer.world, scene().entity]}
            // children change in the engine, e.g. while a level streams in
            version={treeVersion()}
            selected={selection() ? tree.getId(selection()) : null}
            onSelect={(node) => setSelection(node)}
          />
          <NwNodeView data={selection()} registry={props.registry} />
        </div>
      )}
    </Show>
  )
}

export type NwNodeViewProps = {
  data: any
  registry: UiRegistry
}

/**
 * The properties of a node, rendered by the props component of its {@link UiRegistry} entry
 */
export function NwNodeView(props: NwNodeViewProps) {
  const component = () => {
    return props.registry.get(props.data?.constructor)?.propsComponent ?? null
  }
  return (
    <Group title="Properties" style={{ 'max-height': '35vh', overflow: 'auto' }}>
      <Show when={component()}>{(it) => <Dynamic component={it()} data={props.data} />}</Show>
    </Group>
  )
}

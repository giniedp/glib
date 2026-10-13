import type { TransformComponent } from '@gglib/components'
import { GetComponent, type GameEntity } from '@gglib/ecs'
import { Show } from 'solid-js'
import { BoolWidget, ScalarWidget, TextWidget, track } from 'tweak-ui'
import { DebugShapeComponent } from '../../game/debug/DebugShapeComponent'
import icon from '../icons/cube.svg?raw'
import { usePanel } from '../panel'
import { type UiAnnotation } from './types'
import { DebugShapeComponentProps } from './uiDebugShapeComponent'
import { TransformComponentProps } from './uiTransformComponent'

export function GameEntityProps(props: { data: GameEntity }) {
  const panel = usePanel()
  return (
    <Show when={props.data} keyed>
      {(data) => {
        function setActive(active: boolean) {
          if (active && data.canActivate) {
            data.activate()
          }
          if (!active && data.canDeactivate) {
            data.deactivate()
          }
          panel.redraw()
        }
        // activation runs in the engine, it may complete later
        const isActive = track(() => panel.pull(() => data.isActive), { interval: 500 })
        const stateName = track(() => panel.pull(() => data.stateName), { interval: 500 })
        const componentCount = track(() => panel.pull(() => data.activeComponents.length), { interval: 500 })
        return (
          <>
            <TextWidget {...panel.bind(data, 'name')} readonly />
            <TextWidget label="stateName" value={stateName()} readonly />
            <BoolWidget label="Active" value={isActive()} onInput={setActive} />
            <ScalarWidget label="Components" value={componentCount()} readonly decimals={0} />
            <TransformComponentProps data={panel.pull(() => data.getTransform<TransformComponent>())} />
            {/* shown on the entity, since components of inactive entities are not listed */}
            <DebugShapeComponentProps
              data={panel.pull(() => data.component(DebugShapeComponent, GetComponent.Optional))}
            />
          </>
        )
      }}
    </Show>
  )
}

export default {
  icon: () => icon,
  label: (it) => it.name || 'GameEntity',
  propsComponent: GameEntityProps,
  expandable: () => true,
  children: (entity) => {
    return (function* () {
      for (const comp of entity.activeComponents) {
        yield comp
      }
      for (const child of entity.getTransform()?.children ?? []) {
        yield child.entity
      }
    })()
  },
} satisfies UiAnnotation<GameEntity>

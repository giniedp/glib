import type { TransformComponent } from '@gglib/components'
import { GetComponent, type GameEntity } from '@gglib/ecs'
import { DebugShapeComponent } from '../../game/debug/DebugShapeComponent'
import type { FactoryComponent } from 'mithril'
import { h, redrawUi, uiBoolWidget, uiScalarWidget, uiStringWidget } from 'tweak-ui'
import icon from '../icons/cube.svg?raw'
import { type UiAnnotation } from './types'
import { DebugShapeComponentProps } from './uiDebugShapeComponent'
import { TransformComponentProps } from './uiTransformComponent'

export const GameEntityProps: FactoryComponent<{ data: GameEntity }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      const transform = data.getTransform<TransformComponent>()
      return [
        uiStringWidget({
          value: data,
          field: 'name',
          readonly: true,
        }),
        uiStringWidget({
          value: data,
          field: 'stateName',
          readonly: true,
        }),
        uiBoolWidget({
          label: 'Active',
          value: data,
          binding: {
            get: () => data.isActive,
            set: (active: boolean) => {
              if (active && data.canActivate) {
                data.activate()
              }
              if (!active && data.canDeactivate) {
                data.deactivate()
              }
              setTimeout(redrawUi)
            },
          },
        }),
        uiScalarWidget({
          label: 'Components',
          readonly: true,
          value: data,
          binding: { get: (it) => it.activeComponents.length },
        }),
        h(TransformComponentProps, { data: transform }),
        // shown on the entity, since components of inactive entities are not listed
        h(DebugShapeComponentProps, { data: data.component(DebugShapeComponent, GetComponent.Optional) }),
      ]
    },
  }
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

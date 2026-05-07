import { CameraComponent, GameLoop, TransformComponent } from '@gglib/components'
import { GameEntity } from '@gglib/ecs'
import type { FactoryComponent } from 'mithril'
import { h, uiAngle, uiBoolean, uiGroup, uiNumber, uiSelect, uiString, uiVector } from 'tweak-ui'

export type NwNodeViewProps = {
  data: any
}

export const NwNodeView: FactoryComponent<NwNodeViewProps> = () => {
  return {
    oninit() {},
    view({ attrs: { data } }) {
      if (!data) {
        return uiGroup({
          title: 'Properties',
        })
      }
      if (data['tweakUi']) {
        return h({
          view: () => data['tweakUi'](),
        })
      }
      if (data instanceof GameEntity) {
        return h(GameEntityView, { component: data })
      }
      if (data instanceof TransformComponent) {
        return h(TransformComponentView, { component: data })
      }
      if (data instanceof CameraComponent) {
        return h(CameraComponentView, { component: data })
      }
      if (data instanceof GameLoop) {
        return h(GameLoopView, { component: data })
      }
      return uiGroup({
        title: 'Properties',
      })
    },
  }
}

const GameEntityView: FactoryComponent<{ component: GameEntity }> = () => {
  return {
    view({ attrs: { component } }) {
      const transform = component.getTransform()
      console.log('rendering', JSON.stringify(transform.translation))
      return uiGroup({ title: 'Game Entity' }, [
        uiString({ label: 'Name', value: component, field: 'name', disabled: true }),
        uiString({
          label: 'State',
          disabled: true,
          get value() {
            return component.stateName
          },
        }),
        uiNumber({
          label: 'Components',
          disabled: true,
          get value() {
            return component.activeComponents.length
          },
        }),
        h.fragment(
          {},
          transform
            ? [
                uiNumber({
                  label: 'Children',
                  disabled: true,
                  get value() {
                    return transform.children?.length
                  },
                }),
                uiVector({
                  label: 'Position',
                  value: transform.translation,
                  disabled: true,
                }),
                uiVector({
                  label: 'Rotation',
                  value: transform.rotation,
                  keys: ['x', 'y', 'z', 'w'],
                  disabled: true,
                }),
                uiVector({ label: 'Scale', value: transform.scale, disabled: true }),
              ]
            : [],
        ),
      ])
    },
  }
}

const TransformComponentView: FactoryComponent<{ component: TransformComponent }> = () => {
  return {
    view({ attrs: { component } }) {
      return uiGroup({ title: component.name }, [
        uiVector({ label: 'Position', value: component, field: 'translation', disabled: true }),
        uiVector({
          label: 'Rotation',
          value: component,
          field: 'rotation',
          keys: ['x', 'y', 'z', 'w'],
          disabled: true,
        }),
        uiVector({ label: 'Scale', value: component, field: 'scale', disabled: true }),
      ])
    },
  }
}

const CameraComponentView: FactoryComponent<{ component: CameraComponent }> = () => {
  return {
    view({ attrs: { component } }) {
      return uiGroup({ title: 'Camera Component' }, [
        uiNumber({
          label: 'Near',
          value: component,
          field: 'near',
          min: 0.01,
          max: 1,
          step: 0.01,
          slider: true,
        }),
        uiNumber({
          label: 'Far',
          value: component,
          field: 'far',
          min: 2,
          max: 4000,
          step: 1,
          slider: true,
        }),
        uiBoolean({
          label: 'Reversed Z',
          value: component,
          field: 'reversedZ',
        }),
        uiSelect({
          label: 'Type',
          value: component,
          field: 'type',
          options: [
            { value: 'perspective', label: 'Perspective' },
            { value: 'orthographic', label: 'Orthographic' },
          ],
        }),
        component.type === 'perspective'
          ? uiAngle({
              label: 'FOV',
              value: component,
              field: 'perspectiveFov',
              min: 1,
              max: 179,
              step: 1,
            })
          : null,
        component.type === 'orthographic'
          ? uiNumber({
              label: 'Scale',
              value: component,
              field: 'orthographicScale',
              min: 1,
              max: window.innerWidth,
              step: 1,
              slider: true,
            })
          : null,
      ])
    },
  }
}

const GameLoopView: FactoryComponent<{ component: GameLoop }> = () => {
  return {
    view({ attrs: { component } }) {
      return uiGroup({ title: 'Game Loop' }, [
        uiBoolean({
          label: 'Fixed time step',
          value: component,
          field: 'useFixedTimeStep',
        }),
        component.useFixedTimeStep
          ? uiNumber({
              label: 'Target FPS',
              get value() {
                return 1000 / component.targetElapsedTime
              },
              set value(fps: number) {
                component.targetElapsedTime = 1000 / fps
              },
              min: 10,
              max: 200,
              step: 1,
              slider: true,
            })
          : null,
      ])
    },
  }
}

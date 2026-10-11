import type { Children, FactoryComponent } from 'mithril'
import { h, uiBoolWidget, uiButton, uiFlex, uiGroup, uiScalarWidget, uiSelect, uiStringWidget } from 'tweak-ui'
import type { Config, ConfigProperty, ConfigSchema } from '../../config'

/**
 * Generic panel for a {@link Config}: one row per property, grouped by {@link ConfigProperty.group}.
 * The save, load and reset buttons are separate, see {@link configActions}.
 */
export const ConfigProps: FactoryComponent<{ data: Config<ConfigSchema> }> = () => {
  return {
    view({ attrs: { data } }) {
      if (!data) {
        return null
      }
      const groups = new Map<string, Children[]>()
      for (const name of data.names) {
        const group = data.schema[name].group || 'General'
        if (!groups.has(group)) {
          groups.set(group, [])
        }
        groups.get(group).push(propertyRow(data, name))
      }
      return [
        data.names.length ? null : h('div', { style: { padding: '0.25rem' } }, 'No settings yet'),
        [...groups].map(([title, rows]) => uiGroup({ title, collapsible: true }, rows)),
      ]
    },
  }
}

/**
 * Save, load and reset buttons of a {@link Config}, e.g. for a dialog footer
 */
export function configActions(config: Config<ConfigSchema>, attrs: { large?: boolean } = {}): Children {
  return [
    uiButton({ ...attrs, onclick: () => config.save() }, ['Save']),
    uiButton({ ...attrs, onclick: () => config.load() }, ['Load']),
    uiButton({ ...attrs, onclick: () => config.reset() }, ['Reset all']),
  ]
}

function propertyRow(config: Config<ConfigSchema>, name: string): Children {
  const property = config.schema[name]
  const label = config.isModified(name) ? `*${name}` : name
  const binding = {
    get: () => config.value[name],
    set: property.editable ? (value: unknown) => config.set(name, value as never) : undefined,
  }
  return h('div', { title: property.description, key: name }, [
    uiFlex({ flow: 'row', style: { alignItems: 'center' } }, [
      h('div', { style: { flex: 1 } }, [propertyWidget(config, name, property, label, binding)]),
      property.editable
        ? uiButton(
            {
              disabled: !config.isModified(name),
              onclick: () => config.reset(name),
              title: 'reset to default',
            },
            ['↺'],
          )
        : null,
    ]),
  ])
}

function propertyWidget(
  config: Config<ConfigSchema>,
  name: string,
  property: ConfigProperty,
  label: string,
  binding: { get: () => unknown; set?: (value: unknown) => void },
): Children {
  switch (property.kind) {
    case 'boolean':
      return uiBoolWidget({ label, value: config, binding: binding as never, readonly: !property.editable })
    case 'number':
    case 'integer':
      return uiScalarWidget({
        label,
        value: config,
        binding: binding as never,
        min: property.min,
        max: property.max,
        step: property.step ?? (property.kind === 'integer' ? 1 : undefined),
        range: property.min != null && property.max != null,
        decimals: property.kind === 'integer' ? 0 : stepDecimals(property.step),
        readonly: !property.editable,
      })
    case 'choice':
      return uiSelect({
        label,
        value: config,
        binding: binding as never,
        options: [...property.options],
        readonly: !property.editable,
      })
    case 'vec3':
    case 'numberList':
      // edited as comma separated numbers
      return uiStringWidget({
        label,
        value: config,
        binding: {
          get: () => (binding.get() as number[]).join(', '),
          set: binding.set ? (text: string) => binding.set(text.split(',').map((it) => Number(it.trim()))) : undefined,
        },
        readonly: !property.editable,
      })
  }
}

/**
 * Fraction digits to show for a step, e.g. 0.0005 shows 4 digits
 */
function stepDecimals(step: number | undefined): number {
  if (!step) {
    return 3
  }
  const text = String(step)
  return text.includes('.') ? text.length - text.indexOf('.') - 1 : 0
}

import { For, Match, Show, Switch } from 'solid-js'
import { BoolWidget, Button, Flex, Group, ScalarWidget, SelectWidget, TextWidget } from 'tweak-ui'
import type { ChoiceProperty, Config, ConfigProperty, ConfigSchema, NumberProperty } from '../../config'
import { configValue } from '../reactive'

/**
 * Generic panel for a {@link Config}: one row per property, grouped by {@link ConfigProperty.group}.
 * The save, load and reset buttons are separate, see {@link ConfigActions}.
 */
export function ConfigProps(props: { data: Config<ConfigSchema> }) {
  const groups = () => {
    const result = new Map<string, string[]>()
    for (const name of props.data?.names ?? []) {
      const group = props.data.schema[name].group || 'General'
      if (!result.has(group)) {
        result.set(group, [])
      }
      result.get(group).push(name)
    }
    return [...result]
  }
  return (
    <Show when={props.data} keyed>
      {(config) => (
        <>
          <Show when={!config.names.length}>
            <div style={{ padding: '0.25rem' }}>No settings yet</div>
          </Show>
          <For each={groups()}>
            {([title, names]) => (
              <Group title={title} collapsible>
                <For each={names}>{(name) => <PropertyRow config={config} name={name} />}</For>
              </Group>
            )}
          </For>
        </>
      )}
    </Show>
  )
}

/**
 * Save, load and reset buttons of a {@link Config}, e.g. for a dialog footer
 */
export function ConfigActions(props: { config: Config<ConfigSchema>; large?: boolean }) {
  // load and reset notify the changed values, the rows update on their own
  return (
    <>
      <Button large={props.large} onClick={() => props.config.save()}>
        Save
      </Button>
      <Button large={props.large} onClick={() => props.config.load()}>
        Load
      </Button>
      <Button large={props.large} onClick={() => props.config.reset()}>
        Reset all
      </Button>
    </>
  )
}

function PropertyRow(props: { config: Config<ConfigSchema>; name: string }) {
  const property = () => props.config.schema[props.name]
  const value = configValue(props.config, props.name)
  const modified = () => (value(), props.config.isModified(props.name))
  return (
    <div title={property().description}>
      <Flex row>
        <PropertyWidget
          value={value()}
          onChange={(value) => props.config.set(props.name, value as never)}
          property={property()}
          label={modified() ? `*${props.name}` : props.name}
        />
        <Show when={property().editable}>
          <Button disabled={!modified()} onClick={() => props.config.reset(props.name)} title="reset to default" square>
            ↺
          </Button>
        </Show>
      </Flex>
    </div>
  )
}

function PropertyWidget(props: {
  value: unknown
  onChange: (value: unknown) => void
  property: ConfigProperty
  label: string
}) {
  const value = <T,>() => props.value as T
  const set = (value: unknown) => props.onChange(value)
  const readonly = () => !props.property.editable
  return (
    <Switch>
      <Match when={props.property.kind === 'boolean'}>
        <BoolWidget label={props.label} value={value<boolean>()} onInput={set} readonly={readonly()} />
      </Match>
      <Match when={props.property.kind === 'number' || props.property.kind === 'integer'}>
        <NumberWidget
          label={props.label}
          property={props.property}
          value={value<number>()}
          onChange={set}
          readonly={readonly()}
        />
      </Match>
      <Match when={props.property.kind === 'choice'}>
        <SelectWidget
          label={props.label}
          value={value<unknown>()}
          onInput={set}
          options={[...(props.property as ChoiceProperty).options]}
          readonly={readonly()}
        />
      </Match>
      <Match when={props.property.kind === 'vec3' || props.property.kind === 'numberList'}>
        {/* edited as comma separated numbers */}
        <TextWidget
          label={props.label}
          value={value<number[]>().join(', ')}
          onChange={(text) => set(text.split(',').map((it) => Number(it.trim())))}
          readonly={readonly()}
        />
      </Match>
    </Switch>
  )
}

function NumberWidget(props: {
  label: string
  property: ConfigProperty
  value: number
  onChange: (value: number) => void
  readonly: boolean
}) {
  const number = () => props.property as NumberProperty
  const isInteger = () => number().kind === 'integer'
  return (
    <ScalarWidget
      label={props.label}
      value={props.value}
      onChange={props.onChange}
      min={number().min}
      max={number().max}
      step={number().step ?? (isInteger() ? 1 : undefined)}
      range={number().min != null && number().max != null}
      decimals={isInteger() ? 0 : stepDecimals(number().step)}
      readonly={props.readonly}
    />
  )
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

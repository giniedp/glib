import { createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { Button, Group, Tabs } from 'tweak-ui'
import type { SceneLoadOption } from '../../scenes'
import type { LevelLoadOption, NwViewer } from '../../viewer'
import { fromChannel } from '../reactive'
import { ModalDialog } from './modalDialog'

/**
 * Opens the scene selection: levels, particle and material previews.
 * Hidden while a model is shown.
 */
export function ScenesButton(props: { viewer: NwViewer }) {
  const [open, setOpen] = createSignal(false)
  const mode = fromChannel(props.viewer.onModeChanged, () => props.viewer.mode)
  const levelOptions = fromChannel(props.viewer.onLevelOptionsLoaded, () => props.viewer.levelOptions || {})
  const visible = () => mode() !== 'model' && Object.keys(levelOptions()).length > 0
  const select = (value: string) => {
    setOpen(false)
    props.viewer.onLevelSelected(value)
  }
  return (
    <Show when={visible()}>
      <AutoOpen viewer={props.viewer} onOpen={() => setOpen(true)} />
      <Button onClick={() => setOpen(true)}>Scenes</Button>
      <ModalDialog title="Scenes" open={open()} onClose={() => setOpen(false)}>
        <Tabs
          tabs={[
            {
              title: 'Levels',
              content: () => <LevelList options={levelOptions()} onSelect={select} />,
            },
            {
              title: 'Particles',
              content: () => <SceneList options={props.viewer.sceneOptions.particles} onSelect={select} />,
            },
            {
              title: 'Materials',
              content: () => <SceneList options={props.viewer.sceneOptions.materials} onSelect={select} />,
            },
          ]}
        />
      </ModalDialog>
    </Show>
  )
}

/**
 * Opens the scene selection once, if nothing was loaded shortly after start
 */
function AutoOpen(props: { viewer: NwViewer; onOpen: () => void }) {
  onMount(() => {
    const timer = setTimeout(() => {
      if (!props.viewer.mode) {
        props.onOpen()
      }
    }, 1000)
    onCleanup(() => clearTimeout(timer))
  })
  return null
}

/**
 * Levels grouped by category
 */
function LevelList(props: { options: Record<string, LevelLoadOption[]>; onSelect: (value: string) => void }) {
  return (
    <div class="nw-dialog-content">
      <For each={Object.entries(props.options)}>
        {([title, options]) => (
          <Group title={title} collapsible defaultCollapsed>
            <For each={options}>
              {(option) => (
                <SceneButton
                  label={option.label}
                  description={[
                    option.isOpenWorld ? 'Open World' : '',
                    option.isOpenWorld || title === 'raid' || title.match(/battle/) ? '⚠️' : '',
                  ].join('')}
                  onClick={() => props.onSelect(option.value)}
                />
              )}
            </For>
          </Group>
        )}
      </For>
    </div>
  )
}

/**
 * Preview scenes without a level of a tab (particle showcase …)
 */
function SceneList(props: { options: SceneLoadOption[]; onSelect: (value: string) => void }) {
  return (
    <div class="nw-dialog-content">
      <For each={props.options} fallback={<div class="nw-muted">No scenes yet</div>}>
        {(option) => (
          <SceneButton
            label={option.label}
            description={option.description ?? ''}
            onClick={() => props.onSelect(option.value)}
          />
        )}
      </For>
    </div>
  )
}

function SceneButton(props: { label: string; description: string; onClick: () => void }) {
  return (
    <Button block large class="twk:bg-base-100" onClick={props.onClick}>
      <span class="nw-scene-label">{props.label}</span>
      <span class="nw-muted">{props.description}</span>
    </Button>
  )
}

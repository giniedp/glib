import { createEffect, createMemo, createResource, createSignal, For, Match, Show, Suspense, Switch } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { getSlice, statFile } from '../../../api/browse'
import { ModeBar } from '../../common/ModeBar'
import { assetTypes } from '../assetTypes'
import { OpenInViewer } from '../OpenInViewer'
import { browserTabs, type Tab } from '../tabs'
import { contentKind } from './content'
import { ASSET_VIEWS, type ViewContext } from './registry'
import { loadSheet } from './sheet'

/**
 * The content of a tab: the display modes that apply to its file, the chosen one shown. A mode mounts
 * when it is first shown and stays mounted, it keeps its state (scroll position, editor) while another
 * mode is shown.
 */
export function TabView(props: { tab: Tab }) {
  const types = assetTypes()
  const [file] = createResource(
    () => props.tab.path,
    async (path) => {
      const [stat, kind] = await Promise.all([statFile(path), contentKind(path)])
      // a datasheet is parsed up front: whether it is wide decides its modes
      const sheet = path.endsWith('.datasheet') ? await loadSheet(path).catch(() => undefined) : undefined
      // a slice too: only one with models has a 3D view (user decision)
      const slice = path.endsWith('.dynamicslice') ? await getSlice(path).catch(() => undefined) : undefined
      return { path, stat, kind, sheet, slice }
    },
  )
  const ctx = createMemo((): ViewContext | null => {
    const loaded = file()
    return loaded ? { ...loaded, type: types()[loaded.stat.type] } : null
  })
  const views = createMemo(() => {
    const context = ctx()
    return context ? ASSET_VIEWS.filter((view) => view.applies(context)) : []
  })
  const mode = () => views().find((view) => view.id === props.tab.mode) ?? views()[0]

  const [mounted, setMounted] = createSignal<ReadonlySet<string>>(new Set())
  createEffect(() => {
    const id = mode()?.id
    if (id && !mounted().has(id)) {
      setMounted(new Set([...mounted(), id]))
    }
  })

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading…</p>
        </div>
      }
    >
      <Match when={file.error}>
        <div class="nw-empty">
          <p class="nw-note">The file could not be read: {String(file.error)}</p>
        </div>
      </Match>
      <Match when={ctx()}>
        {(context) => (
          <>
            <Show when={views().length > 1}>
              <ModeBar
                modes={views()}
                active={mode()?.id}
                onSelect={(id) => browserTabs.setMode(props.tab.id, id)}
                tools={<OpenInViewer path={props.tab.path} />}
              />
            </Show>
            <For each={views()}>
              {(view) => (
                <Show when={mounted().has(view.id)}>
                  <div class="nw-view" classList={{ 'nw-hidden': view.id !== mode()?.id }}>
                    {/* views may be lazy, e.g. the ones with ag-grid */}
                    <Suspense
                      fallback={
                        <div class="nw-empty">
                          <p class="nw-note">Reading…</p>
                        </div>
                      }
                    >
                      <Dynamic
                        component={view.component}
                        ctx={context()}
                        shown={view.id === mode()?.id && browserTabs.active() === props.tab.id}
                      />
                    </Suspense>
                  </div>
                </Show>
              )}
            </For>
          </>
        )}
      </Match>
    </Switch>
  )
}

import { useSearchParams } from '@solidjs/router'
import { createMemo, createResource, createSignal, For, Match, onMount, Show, Switch } from 'solid-js'
import { Button, Icon, SelectInput, Split, TextInput } from 'tweak-ui'
import type { SheetFamily } from '../../api/browse'
import { AppBar } from '../app/AppBar'
import svgArrowLeft from '../icons/arrow-left.svg?raw'
import svgArrowRight from '../icons/arrow-right.svg?raw'
import svgSearch from '../icons/magnifying-glass.svg?raw'
import { FamilyView } from './FamilyView'
import { loadFamily, loadSchema } from './families'
import { ensureLoc, locLanguage, locLanguages, setLocLanguage } from './loc'

/**
 * The Data tool: the datasheets by family (the row type of the sheet header), not by file. Rows link to the rows they
 * reference, loc keys show their text, audio triggers play, appearances render (tmp/datasheets/plan.md).
 * The selection is in the url, so links are history entries: back and forward follow them.
 */
export default function DataTool() {
  // the family, and the row by its key (or by its index for rows without a key)
  const [params, setParams] = useSearchParams<{ family?: string; key?: string; row?: string }>()
  const [schema] = createResource(loadSchema)
  const family = createMemo(() => (params.family ? schema()?.byName.get(params.family.toLowerCase()) : undefined))
  const [rows] = createResource(family, loadFamily)
  const [languages] = createResource(locLanguages)
  onMount(ensureLoc)

  const selectFamily = (name: string) => setParams({ family: name, key: undefined, row: undefined })
  const selectRow = (key: string | null, row: number) =>
    setParams(key ? { key, row: undefined } : { key: undefined, row: String(row) }, { replace: true })
  const openRow = (familyName: string, key: string) => setParams({ family: familyName, key, row: undefined })

  return (
    <div class="tweak-ui nw-tool nw-tool-page nw-browser nw-data">
      <AppBar
        start={
          <>
            <Button ghost square title="Back" icon={<Icon svg={svgArrowLeft} />} onClick={() => history.back()} />
            <Button ghost square title="Forward" icon={<Icon svg={svgArrowRight} />} onClick={() => history.forward()} />
          </>
        }
        end={
          <Show when={languages()?.length}>
            <span title="Language of the localized texts">
              <SelectInput
                value={locLanguage() ?? ''}
                options={languages() ?? []}
                onChange={(value) => setLocLanguage(String(value))}
              />
            </span>
          </Show>
        }
      />
      <Split row class="nw-browser-split" fluid={1} minSize={200} defaultSizes={['clamp(16rem, 18%, 24rem)']}>
        <aside class="nw-browser-sidebar">
          <Switch>
            <Match when={schema.error}>
              <p class="nw-note">The datasheets could not be read: {String(schema.error)}</p>
            </Match>
            <Match when={schema()}>
              {(it) => <FamilyList families={it().families} selected={family()?.name ?? null} onSelect={selectFamily} />}
            </Match>
            <Match when={true}>
              <p class="nw-note">Reading the datasheets…</p>
            </Match>
          </Switch>
        </aside>
        <main class="nw-browser-main">
          <Switch>
            <Match when={!params.family}>
              <div class="nw-empty">
                <p class="nw-note">Select a row type on the left. Links in a row open the rows they name.</p>
              </div>
            </Match>
            <Match when={schema() && !family()}>
              <div class="nw-empty">
                <p class="nw-note">There is no row type {params.family}.</p>
              </div>
            </Match>
            <Match when={rows.error}>
              <div class="nw-empty">
                <p class="nw-note">The sheets could not be read: {String(rows.error)}</p>
              </div>
            </Match>
            <Match when={rows.loading}>
              <div class="nw-empty">
                <p class="nw-note">Reading {family()?.sheets.length} sheets…</p>
              </div>
            </Match>
            {/* keyed: another family is a new grid */}
            <Match when={rows()} keyed>
              {(it) => (
                <FamilyView
                  rows={it}
                  rowKey={params.key ?? null}
                  rowIndex={params.row != null ? Number(params.row) : null}
                  onSelect={selectRow}
                  onOpen={openRow}
                />
              )}
            </Match>
          </Switch>
        </main>
      </Split>
    </div>
  )
}

/**
 * The families with a filter over family and sheet names
 */
function FamilyList(props: { families: SheetFamily[]; selected: string | null; onSelect: (name: string) => void }) {
  const [query, setQuery] = createSignal('')
  const shown = createMemo(() => {
    const text = query().trim().toLowerCase()
    if (!text) {
      return props.families.map((family) => ({ family, sheets: [] as string[] }))
    }
    return props.families.flatMap((family) => {
      const sheets = family.sheets.map((it) => it.name).filter((name) => name.toLowerCase().includes(text))
      return family.name.toLowerCase().includes(text) || sheets.length ? [{ family, sheets }] : []
    })
  })

  return (
    <>
      <div class="nw-search">
        <TextInput placeholder="Filter row types and sheets" slotBefore={<Icon svg={svgSearch} />} onInput={setQuery} />
      </div>
      <div class="nw-browser-list nw-family-list">
        <For each={shown()}>
          {(it) => (
            <button
              type="button"
              class="nw-family"
              classList={{ 'nw-family-active': it.family.name === props.selected }}
              title={it.family.sheets.map((sheet) => sheet.name).join('\n')}
              onClick={() => props.onSelect(it.family.name)}
            >
              <span class="nw-family-name">{it.family.name}</span>
              <span class="nw-family-count">
                {it.family.sheets.length > 1 ? `${it.family.sheets.length} sheets · ` : ''}
                {it.family.rows.toLocaleString()}
              </span>
              <Show when={it.sheets.length}>
                <span class="nw-family-sheets">{it.sheets.join(', ')}</span>
              </Show>
            </button>
          )}
        </For>
      </div>
      <div class="nw-search-summary nw-muted nw-family-summary">{shown().length} of {props.families.length} row types</div>
    </>
  )
}

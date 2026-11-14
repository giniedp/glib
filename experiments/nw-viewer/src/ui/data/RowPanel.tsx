import { createMemo, createResource, For, Match, Show, Switch } from 'solid-js'
import { Button, Icon, Widget } from 'tweak-ui'
import { thumbnailUrl, type SheetColumn } from '../../api/browse'
import { assetPath, findAsset } from './assets'
import { useTools } from '../app/tools'
import svgOpen from '../icons/arrow-up-right-from-square.svg?raw'
import { AudioButton } from './AudioButton'
import { cellItems, familyText, resolveRefs, rowKey, type FamilyRows, type RowRef } from './families'
import { kindLabel } from './FamilyView'
import { locText } from './loc'
import { locElement, locPlain } from './locMarkup'
import { RowPreview } from './RowPreview'

/**
 * The filled fields of a row, by what their column holds: links to the rows a reference names, the text of loc
 * keys, files to open in the browser, audio to play. On top: the row's name, icon and 3D preview.
 */
export function RowPanel(props: { rows: FamilyRows; row: number; onOpen: (family: string, key: string) => void }) {
  const fields = createMemo(() =>
    props.rows.family.columns.flatMap((column, c) => {
      const text = familyText(props.rows, props.row, c)
      return text ? [{ column, text }] : []
    }),
  )
  const title = createMemo(() => {
    const name = fields().find((it) => it.column.kind === 'loc' && /name/i.test(it.column.name))
    return name ? locPlain(locText(name.text) ?? name.text) : rowKey(props.rows, props.row)
  })
  const icon = createMemo(
    () =>
      fields().find((it) => it.column.kind === 'asset' && /icon/i.test(it.column.name) && /\.(png|dds)$/i.test(it.text))
        ?.text,
  )
  const sheet = () => props.rows.family.sheets[props.rows.sheetOf[props.row]]
  const from = (): RowRef => ({ family: props.rows.family.name, key: rowKey(props.rows, props.row) })

  return (
    <aside class="nw-sheet-row nw-data-row">
      <div class="nw-data-row-head">
        <Show when={icon()}>{(path) => <img class="nw-data-icon" src={thumbnailUrl(assetPath(path()), 96)} alt="" />}</Show>
        <div class="nw-data-row-title">
          <span class="nw-data-row-name">{title()}</span>
          <span class="nw-muted" title={sheet().path}>
            {rowKey(props.rows, props.row) || `row ${props.row}`} · {sheet().name}
          </span>
        </div>
      </div>
      <div class="nw-sheet-fields">
        <RowPreview rows={props.rows} row={props.row} />
        <For each={fields()}>
          {(field) => (
            <Widget
              label={<span title={field.column.kind ? kindLabel(field.column.kind, field.column.refs) : undefined}>{field.column.name}</span>}
            >
              <FieldValue column={field.column} text={field.text} from={from()} onOpen={props.onOpen} />
            </Widget>
          )}
        </For>
      </div>
    </aside>
  )
}

function FieldValue(props: {
  column: SheetColumn
  text: string
  from: RowRef
  onOpen: (family: string, key: string) => void
}) {
  return (
    <Switch fallback={<span class="nw-data-text">{props.text}</span>}>
      <Match when={props.column.kind === 'ref' || props.column.kind === 'key'}>
        <span class="nw-data-items">
          <For each={cellItems(props.text)}>
            {(key) =>
              props.column.kind === 'ref' ? (
                <RefLink column={props.column} value={key} from={props.from} onOpen={props.onOpen} />
              ) : (
                <span class="nw-data-text">{key}</span>
              )
            }
          </For>
        </span>
      </Match>
      <Match when={props.column.kind === 'loc'}>
        <span class="nw-data-text" title={props.text}>
          {locElement(locText(props.text) ?? props.text)}
        </span>
      </Match>
      <Match when={props.column.kind === 'asset'}>
        <span class="nw-data-items">
          <For each={cellItems(props.text)}>{(path) => <AssetLink path={path} />}</For>
        </span>
      </Match>
      <Match when={props.column.kind === 'audio'}>
        <span class="nw-data-items">
          <For each={cellItems(props.text)}>{(name) => <AudioButton trigger={name} />}</For>
        </span>
      </Match>
    </Switch>
  )
}

/**
 * A key of another family: a link to the row of the best matching family that has it, and small links to the other
 * families that have it too. Plain text when none has it.
 */
function RefLink(props: { column: SheetColumn; value: string; from: RowRef; onOpen: (family: string, key: string) => void }) {
  const [targets] = createResource(
    () => props.value,
    (value) => resolveRefs(props.column, value, props.from),
  )
  const link = (target: RowRef, text: string, extra: boolean) => (
    <a
      class="nw-data-link"
      classList={{ 'nw-data-link-alt': extra }}
      href={`/data?family=${encodeURIComponent(target.family)}&key=${encodeURIComponent(target.key)}`}
      title={`${target.family}: ${target.key}`}
      onClick={(e) => {
        e.preventDefault()
        props.onOpen(target.family, target.key)
      }}
    >
      {text}
    </a>
  )
  return (
    <Show
      when={targets()?.length}
      fallback={
        <span
          class="nw-data-text"
          classList={{ 'nw-data-dead': targets.state === 'ready' }}
          title={targets.state === 'ready' ? `No row of ${props.column.refs?.join(', ')} has this key` : undefined}
        >
          {props.value}
        </span>
      }
    >
      <span class="nw-data-ref">
        {link(targets()![0], props.value, false)}
        <For each={targets()!.slice(1)}>{(target) => link(target, target.family, true)}</For>
      </span>
    </Show>
  )
}

/**
 * A file path: opens the file in the browser, plain text when the archive lacks it
 */
function AssetLink(props: { path: string }) {
  const tools = useTools()
  const [file] = createResource(() => props.path, findAsset)
  return (
    <span class="nw-data-asset">
      <span class="nw-data-text" classList={{ 'nw-data-dead': file.state === 'ready' && !file() }}>
        {props.path}
      </span>
      <Show when={file()}>
        {(it) => (
          <Button
            ghost
            square
            title={`Open ${it()} in the browser`}
            icon={<Icon svg={svgOpen} />}
            onClick={() => tools.open('browser', `?file=${encodeURIComponent(it())}`)}
          />
        )}
      </Show>
    </span>
  )
}

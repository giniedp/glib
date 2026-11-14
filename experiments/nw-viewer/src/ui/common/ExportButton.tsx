import { createMemo, createSignal, For, onCleanup, Show } from 'solid-js'
import { BoolWidget, Button, Group, Icon, SelectWidget, Widget } from 'tweak-ui'
import { downloadExport, exportActions, exportOptionNames, type ExportAction, type ExportOptions } from '../../api/export'
import { exportConfig } from '../../config'
import svgDownload from '../icons/download.svg?raw'
import { ModalDialog } from '../viewer/panels/modalDialog'
import { configValue } from '../viewer/reactive'

/**
 * Labels of the export options in the dialog, the descriptions of the config are their tooltips
 */
const OPTION_LABELS: Record<keyof ExportOptions, string> = {
  textures: 'Textures',
  textureSize: 'Texture size',
  normals: 'DDS normals',
  yUp: 'Y up',
  quantize: 'Quantize',
  allLods: 'All LODs',
  keepNoDraw: 'Keep NoDraw',
}

/**
 * Opens the export dialog of a file, in two groups (see {@link exportActions}):
 * - Export: the options of the asset type ({@link exportOptionNames}) on top, the conversions by nwbt below
 * - Download: the files as stored, no options
 *
 * The options are saved for the browser session on every change ({@link exportConfig}).
 */
export function ExportButton(props: {
  path: string
  /**
   * Material that overrides the model's own (`.cgf`, `.skin`), e.g. the one of an entity
   */
  material?: string
  ghost?: boolean
  /**
   * Icon only, e.g. next to a field
   */
  square?: boolean
  /**
   * The text of the button, default "Export"
   */
  label?: string
}) {
  const [open, setOpen] = createSignal(false)
  const name = () => props.path.split('/').pop() ?? props.path
  return (
    <>
      <Button
        ghost={props.ghost}
        square={props.square}
        title="Export: download the file, as stored or converted (png, glTF, glTF with DDS for Blender)"
        icon={<Icon svg={svgDownload} />}
        onClick={() => setOpen(true)}
      >
        {props.square ? null : (props.label ?? 'Export')}
      </Button>
      <ModalDialog title={`Export ${name()}`} open={open()} onClose={() => setOpen(false)}>
        {/* created on open: downloads of a closed dialog are aborted */}
        <Show when={open()}>
          <div class="nw-dialog-content nw-dialog-content-wide nw-export-content">
            <ExportGroups path={props.path} material={props.material} />
          </div>
        </Show>
      </ModalDialog>
    </>
  )
}

/**
 * The current export options, reactive
 */
function useExportOptions(): () => ExportOptions {
  const config = exportConfig()
  const textures = configValue(config, 'textures')
  const textureSize = configValue(config, 'textureSize')
  const normals = configValue(config, 'normals')
  const yUp = configValue(config, 'yUp')
  const quantize = configValue(config, 'quantize')
  const allLods = configValue(config, 'allLods')
  const keepNoDraw = configValue(config, 'keepNoDraw')
  return () => ({
    textures: textures(),
    textureSize: textureSize(),
    normals: normals(),
    yUp: yUp(),
    quantize: quantize(),
    allLods: allLods(),
    keepNoDraw: keepNoDraw(),
  })
}

/**
 * The options of the file's exports, only the ones that apply (e.g. DDS normals with DDS textures)
 */
function ExportOptionsForm(props: { path: string; options: ExportOptions }) {
  const config = exportConfig()
  const names = () => exportOptionNames(props.path, props.options)
  return (
    <Show when={names().length}>
      <div class="nw-export-options">
        <For each={names()}>
          {(name) => {
            const property = config.schema[name]
            return (
              <div title={property.description}>
                <Show
                  when={property.kind === 'choice'}
                  fallback={
                    <BoolWidget
                      label={OPTION_LABELS[name]}
                      value={props.options[name] as boolean}
                      onInput={(value) => config.set(name, value as never)}
                    />
                  }
                >
                  <SelectWidget
                    label={OPTION_LABELS[name]}
                    value={props.options[name]}
                    onInput={(value) => config.set(name, value as never)}
                    options={property.kind === 'choice' ? [...property.options] : []}
                  />
                </Show>
              </div>
            )
          }}
        </For>
      </div>
    </Show>
  )
}

/**
 * Download status of an action: progress while it runs, the error when it failed. Nothing after a download.
 */
type DownloadState = { busy: boolean; text: string; error: boolean }

/**
 * Export (options, then the conversions) and Download (the files as stored). A group without actions is left out.
 */
function ExportGroups(props: { path: string; material?: string }) {
  const options = useExportOptions()
  const actions = createMemo(() => exportActions(props.path, options(), props.material))
  const exports = () => actions().filter((it) => it.group === 'export')
  const downloads = () => actions().filter((it) => it.group === 'download')

  const [states, setStates] = createSignal<Record<string, DownloadState | undefined>>({})
  const setState = (id: string, state: DownloadState | undefined) => setStates({ ...states(), [id]: state })
  const abort = new AbortController()
  onCleanup(() => abort.abort())

  const start = (item: ExportAction) => {
    setState(item.id, { busy: true, text: 'Converting…', error: false })
    downloadExport(
      item,
      (loaded, total) =>
        setState(item.id, {
          busy: true,
          text: total ? `${Math.round((loaded / total) * 100)}%` : formatBytes(loaded),
          error: false,
        }),
      abort.signal,
    ).then(
      () => setState(item.id, undefined),
      (err) => {
        if (!abort.signal.aborted) {
          setState(item.id, { busy: false, text: String(err?.message ?? err), error: true })
        }
      },
    )
  }

  // widget rows like the options: the description in the label column, the button in the control column
  const list = (items: ExportAction[]) => (
    <div class="nw-export-list">
      <For each={items}>
        {(item) => {
          const state = () => states()[item.id]
          return (
            <div title={item.title}>
              <Widget label={item.title}>
                <div class="nw-export-action">
                  <Button disabled={state()?.busy} icon={<Icon svg={svgDownload} />} onClick={() => start(item)}>
                    {item.label}
                  </Button>
                  <span classList={{ 'nw-note': !state()?.error, 'nw-error': !!state()?.error }}>{state()?.text}</span>
                </div>
              </Widget>
            </div>
          )
        }}
      </For>
    </div>
  )

  return (
    <>
      <Show when={exports().length}>
        <Group title="Export">
          <ExportOptionsForm path={props.path} options={options()} />
          {list(exports())}
        </Group>
      </Show>
      <Show when={downloads().length}>
        <Group title="Download">{list(downloads())}</Group>
      </Show>
    </>
  )
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

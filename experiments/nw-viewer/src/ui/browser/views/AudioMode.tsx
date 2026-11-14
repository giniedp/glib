import type { GridApi } from 'ag-grid-community'
import { createEffect, createResource, createSignal, Match, onCleanup, onMount, Show, Switch } from 'solid-js'
import { Button, TextInput } from 'tweak-ui'
import { saveBlob } from '../../../api/export'
import { mediaWav } from '../../../api/exportAudio'
import {
  audioPreview,
  bankContents,
  bankMediaNames,
  mediaFileName,
  type BankMedia,
  type MediaLoader,
} from '../../../audio/preview'
import { getWwiseBankMedia, parseWwiseBank, wwiseShortId, type WwiseBank } from '../../../audio/wwise'
import { columnWidth, Grid } from '../../common/grid'
import { formatBytes } from '../../common/format'
import { contentBytes, fileBytes } from './content'
import type { ViewContext } from './registry'

/**
 * How often the position of the playing clip is shown again
 */
const POSITION_POLL_MS = 100

/**
 * The playback state of the preview as signals, kept while the view is mounted
 */
function usePreview() {
  const [version, setVersion] = createSignal(0)
  const [position, setPosition] = createSignal(0)
  onCleanup(audioPreview.onChange(() => setVersion((it) => it + 1)))
  const timer = setInterval(() => setPosition(audioPreview.position()), POSITION_POLL_MS)
  onCleanup(() => clearInterval(timer))
  return {
    version,
    position,
    playing: () => {
      version()
      return audioPreview.playback
    },
  }
}

/**
 * Stops the preview when the view is hidden (another mode or tab) and when it closes
 */
function useStopWhenHidden(shown: () => boolean) {
  createEffect(() => {
    if (!shown()) {
      audioPreview.stop()
    }
  })
  onCleanup(() => audioPreview.stop())
}

/**
 * A `.bnk` sound bank: its embedded and streamed media, each one plays (decoded with vgmstream). Loaded with `lazy()`,
 * ag-grid loads with it.
 */
export function AudioBankMode(props: { ctx: ViewContext; shown: boolean }) {
  const [bank] = createResource(
    () => props.ctx.path,
    async (path) => {
      const parsed = parseWwiseBank(await contentBytes(path))
      // the names of the events that play the media, some stay unnamed (media only banks)
      const names = await bankMediaNames(path, parsed)
      return { bank: parsed, contents: bankContents(parsed, path, names) }
    },
  )
  const preview = usePreview()
  useStopWhenHidden(() => props.shown)
  let api: GridApi<BankMedia> | undefined
  const durations = new Map<string, number>()

  const keyOf = (media: BankMedia) => media.path ?? `${props.ctx.path}#${media.id}`
  const loaderOf = (wwise: WwiseBank, media: BankMedia): MediaLoader => {
    if (media.kind === 'embedded') {
      return async () => getWwiseBankMedia(wwise, media.id) ?? new Uint8Array()
    }
    return async (signal) => {
      if (!media.path) {
        throw new Error('the folder of the streamed media is unknown')
      }
      return fileBytes(media.path, signal).catch(() => {
        throw new Error('not in the paks')
      })
    }
  }
  const save = async (wwise: WwiseBank, media: BankMedia, format: 'wav' | 'wem', button: HTMLButtonElement) => {
    const stem = (props.ctx.path.split('/').pop() ?? '').replace(/\.bnk$/i, '')
    button.disabled = true
    try {
      const wem = await loaderOf(wwise, media)()
      const data = format === 'wav' ? await mediaWav(async () => wem) : wem
      const type = format === 'wav' ? 'audio/wav' : 'application/octet-stream'
      saveBlob(new Blob([data as BlobPart], { type }), `${stem}_${mediaFileName(media, format)}`)
      button.title = ''
    } catch (err) {
      button.title = String(err instanceof Error ? err.message : err)
      button.classList.add('nw-error')
    } finally {
      button.disabled = false
    }
  }
  const toggle = (wwise: WwiseBank, media: BankMedia) => {
    const key = keyOf(media)
    if (audioPreview.playback?.key === key) {
      audioPreview.stop()
      return
    }
    audioPreview.play(key, loaderOf(wwise, media))
  }

  // durations and the play buttons follow the playback
  createEffect(() => {
    const playing = preview.playing()
    if (playing) {
      durations.set(playing.key, playing.duration)
    }
    api?.refreshCells({ columns: ['play', 'duration'], force: true })
  })

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading…</p>
        </div>
      }
    >
      <Match when={bank.error}>
        <div class="nw-empty">
          <p class="nw-note">The bank could not be read: {String(bank.error)}</p>
        </div>
      </Match>
      <Match when={bank()}>
        {(data) => {
          const { bank: wwise, contents } = data()
          const embedded = contents.media.filter((it) => it.kind === 'embedded').length
          return (
            <>
              <div class="nw-view-bar">
                <TextInput
                  class="nw-view-filter"
                  placeholder="Filter events and ids"
                  onInput={(text) => api?.setGridOption('quickFilterText', text)}
                />
                <span class="nw-view-info">
                  {`bank ${wwise.id} · v${wwise.version} · ${languageName(wwise.languageId, props.ctx.path)} · `}
                  {`${embedded} embedded, ${contents.media.length - embedded} streamed, `}
                  {`${contents.media.filter((it) => it.events.length).length} named`}
                  {contents.external ? ` · ${contents.external} in other banks` : ''}
                  {contents.unparsed ? ` · ${contents.unparsed} objects not readable (v${wwise.version})` : ''}
                </span>
                <PlayingInfo preview={preview} />
              </div>
              <Show
                when={contents.media.length}
                fallback={
                  <div class="nw-empty">
                    <p class="nw-note">The bank holds no media of its own.</p>
                  </div>
                }
              >
                <Grid<BankMedia>
                  ref={(it) => (api = it)}
                  options={{
                    rowData: contents.media,
                    columnDefs: [
                      {
                        colId: 'play',
                        headerName: '',
                        sortable: false,
                        cellClass: 'nw-ag-buttons',
                        cellRenderer: (p: { data: BankMedia }) => {
                          const button = document.createElement('button')
                          const key = keyOf(p.data)
                          button.className = 'twk-btn twk-btn-sm nw-audio-play'
                          button.textContent = audioPreview.playback?.key === key ? '■' : '▶'
                          button.title = audioPreview.errors.get(key) ?? 'Play'
                          button.classList.toggle('nw-error', audioPreview.errors.has(key))
                          button.onclick = () => toggle(wwise, p.data)
                          return button
                        },
                      },
                      { field: 'id', headerName: 'Media id', width: columnWidth('Media id', 10) },
                      { field: 'kind', headerName: 'Kind', width: columnWidth('Kind', 8) },
                      {
                        field: 'size',
                        headerName: 'Size',
                        width: columnWidth('Size', 9),
                        type: 'rightAligned',
                        valueFormatter: (p) => (p.value ? formatBytes(p.value) : ''),
                      },
                      {
                        colId: 'duration',
                        headerName: 'Duration',
                        width: columnWidth('Duration', 8),
                        type: 'rightAligned',
                        valueGetter: (p) => durations.get(keyOf(p.data!)) ?? null,
                        valueFormatter: (p) => (p.value == null ? '' : formatDuration(p.value)),
                      },
                      {
                        colId: 'export',
                        headerName: 'Export',
                        sortable: false,
                        cellClass: 'nw-ag-buttons',
                        cellRenderer: (p: { data: BankMedia }) => {
                          const cell = document.createDocumentFragment()
                          for (const format of ['wav', 'wem'] as const) {
                            const button = document.createElement('button')
                            button.className = 'twk-btn twk-btn-sm nw-audio-action'
                            button.textContent = format
                            button.title = `Save as .${format}`
                            button.onclick = () => save(wwise, p.data, format, button)
                            cell.append(button)
                          }
                          return cell
                        },
                      },
                      {
                        colId: 'events',
                        headerName: 'Event',
                        flex: 2,
                        valueGetter: (p) => p.data!.events.join(', '),
                        tooltipValueGetter: (p) => p.data!.events.join('\n'),
                      },
                      { field: 'path', headerName: 'File', flex: 1, tooltipField: 'path' },
                    ],
                    defaultColDef: { sortable: true, resizable: true },
                    // the button columns are as wide as their rendered buttons
                    onFirstDataRendered: (e) => e.api.autoSizeColumns(['play', 'export'], false),
                  }}
                />
              </Show>
            </>
          )
        }}
      </Match>
    </Switch>
  )
}

/**
 * A `.wem` media file: plays it (decoded with vgmstream), its format and its waveform
 */
export function AudioMediaMode(props: { ctx: ViewContext; shown: boolean }) {
  const preview = usePreview()
  useStopWhenHidden(() => props.shown)
  const key = () => props.ctx.path
  const load: MediaLoader = () => contentBytes(props.ctx.path)
  const [clip] = createResource(key, (it) => audioPreview.clip(it, load))
  let canvas!: HTMLCanvasElement

  const draw = () => {
    const buffer = clip()
    if (buffer && canvas) {
      drawWaveform(canvas, buffer, preview.playing()?.key === key() ? preview.position() / buffer.duration : null)
    }
  }
  createEffect(draw)
  onMount(() => {
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    onCleanup(() => observer.disconnect())
  })

  const toggle = () => {
    if (audioPreview.playback?.key === key()) {
      audioPreview.stop()
    } else {
      audioPreview.play(key(), load)
    }
  }

  return (
    <div class="nw-audio">
      <div class="nw-view-bar">
        <Button ghost disabled={!clip()} onClick={toggle}>
          {preview.playing()?.key === key() ? 'Stop' : 'Play'}
        </Button>
        <span class="nw-view-info">
          <Show when={clip()} fallback={clip.error ? `Could not be decoded: ${String(clip.error)}` : 'Decoding…'}>
            {(buffer) => (
              // an expression of the template, a plain string of this function would not follow the position
              <>
                {`${formatDuration(preview.playing()?.key === key() ? preview.position() : 0)} / ` +
                  `${formatDuration(buffer().duration)} · ${buffer().numberOfChannels} ch · ${buffer().sampleRate} Hz`}
              </>
            )}
          </Show>
        </span>
      </div>
      <canvas class="nw-audio-wave" ref={canvas} />
    </div>
  )
}

/**
 * What plays, from any audio view: id and position, and a stop button
 */
function PlayingInfo(props: { preview: ReturnType<typeof usePreview> }) {
  return (
    <Show when={props.preview.playing()}>
      {(playing) => (
        <span class="nw-view-info nw-push-end">
          {`${playing().key.split(/[/#]/).pop()} · ${formatDuration(props.preview.position())} / ${formatDuration(playing().duration)} · ${playing().channels} ch `}
          <Button ghost onClick={() => audioPreview.stop()}>
            Stop
          </Button>
        </span>
      )}
    </Show>
  )
}

/**
 * The name of a bank's language: SFX, or the bank's folder when it is the language (see `streamedMediaFolder`)
 */
function languageName(languageId: number, bankPath: string) {
  if (languageId === wwiseShortId('SFX')) {
    return 'SFX'
  }
  const folder = bankPath.split('/').at(-2) ?? ''
  return wwiseShortId(folder) === languageId ? folder : `language ${languageId}`
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${(seconds - minutes * 60).toFixed(1).padStart(4, '0')}`
}

/**
 * Min and max of every pixel column of a waveform, all channels in one: [min0, max0, min1, max1, …]
 */
function waveformPeaks(buffer: AudioBuffer, width: number): Float32Array {
  const peaks = new Float32Array(width * 2)
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i))
  const step = buffer.length / width
  for (let x = 0; x < width; x++) {
    let min = 0
    let max = 0
    const end = Math.min(buffer.length, Math.floor((x + 1) * step))
    for (const data of channels) {
      for (let i = Math.floor(x * step); i < end; i++) {
        min = Math.min(min, data[i])
        max = Math.max(max, data[i])
      }
    }
    peaks[x * 2] = min
    peaks[x * 2 + 1] = max
  }
  return peaks
}

/**
 * The peaks of the last drawn waveform, computed again only for another clip or width
 */
let lastPeaks: { buffer: AudioBuffer; width: number; peaks: Float32Array } | null = null

/**
 * The waveform of a clip, the played part in the accent color
 */
function drawWaveform(canvas: HTMLCanvasElement, buffer: AudioBuffer, progress: number | null) {
  const width = Math.floor(canvas.clientWidth * devicePixelRatio)
  const height = Math.floor(canvas.clientHeight * devicePixelRatio)
  const ctx = canvas.getContext('2d')
  if (!ctx || !width || !height) {
    return
  }
  canvas.width = width
  canvas.height = height
  if (lastPeaks?.buffer !== buffer || lastPeaks.width !== width) {
    lastPeaks = { buffer, width, peaks: waveformPeaks(buffer, width) }
  }
  const { peaks } = lastPeaks
  const style = getComputedStyle(canvas)
  const played = style.getPropertyValue('--nw-accent')
  const mid = height / 2
  for (let x = 0; x < width; x++) {
    const min = peaks[x * 2]
    const max = peaks[x * 2 + 1]
    ctx.fillStyle = progress != null && x / width <= progress ? played : style.color
    ctx.fillRect(x, mid - max * mid, 1, Math.max(1, (max - min) * mid))
  }
}

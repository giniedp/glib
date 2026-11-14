import { filesUrl } from '../../api/browse'
import { parseAtlControls, parseWwiseBank, wwiseShortId, type WwiseBank } from '../wwise'
import { mediaEventNames } from './media'

/**
 * The ATL controls of the game: every trigger names its Wwise events
 */
const ATL_CONTROLS = 'libs/gameaudio/wwise/atl_controls.xml'

let eventNames: Promise<Map<number, string>> | null = null

/**
 * The Wwise event names of the ATL triggers by event id (the short id of the name), loaded once. Empty when the
 * controls do not load: the names are a convenience.
 */
export function atlEventNames(): Promise<Map<number, string>> {
  eventNames ??= fetch(filesUrl(ATL_CONTROLS))
    .then((res) => {
      if (!res.ok) {
        throw new Error(`${res.status}`)
      }
      return res.text()
    })
    .then((xml) => {
      const result = new Map<number, string>()
      for (const trigger of parseAtlControls(xml).triggers.values()) {
        for (const event of trigger.events) {
          result.set(wwiseShortId(event), event)
        }
      }
      return result
    })
    .catch((err) => {
      console.warn('audio event names not loaded:', String(err))
      eventNames = null
      return new Map<number, string>()
    })
  return eventNames
}

/**
 * The event names of the media of a bank, see {@link mediaEventNames}. The events of a bank are often in a sibling
 * `<name>_events.bnk` (e.g. `ambiences_events.bnk`), it is walked with the bank when it exists. Media only banks (e.g.
 * the biome wildlife banks) get no names: the banks that play them are not known from the bank.
 */
export async function bankMediaNames(path: string, bank: WwiseBank, signal?: AbortSignal): Promise<Map<number, string[]>> {
  const [names, sibling] = await Promise.all([atlEventNames(), loadBank(path.replace(/\.bnk$/i, '_events.bnk'), signal)])
  return mediaEventNames(sibling ? [bank, sibling] : [bank], names)
}

async function loadBank(path: string, signal?: AbortSignal): Promise<WwiseBank | null> {
  try {
    const res = await fetch(filesUrl(path), { signal })
    return res.ok ? parseWwiseBank(new Uint8Array(await res.arrayBuffer())) : null
  } catch {
    return null
  }
}

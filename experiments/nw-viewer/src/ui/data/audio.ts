/**
 * Audio of the Data tool: an audio trigger name of a cell (`Play_Imp_SwordMetal_Metal`) resolved to the media it can
 * play. ATL trigger → Wwise events → banks (trigger bank map) → the event's media in those banks. Only the media are
 * played, one at a time, without switches, RTPCs or 3D (not the event player, browser-features B5).
 */
import { filesUrl, nwbtBaseUrl } from '../../api/browse'
import { loadAudioCatalog, type AudioCatalog } from '../../audio/engine/catalog'
import { bankContents, mediaEventNames, type MediaLoader } from '../../audio/preview'
import { getWwiseBankMedia, parseWwiseBank, wwiseShortId, type WwiseBank } from '../../audio/wwise'
import { fileBytes } from '../browser/views/content'

/**
 * The folder of the banks, as the audio engine loads them
 */
const BANK_FOLDER = 'sounds/wwise'

let catalog: Promise<AudioCatalog> | null = null
function audioCatalog() {
  if (!catalog) {
    catalog = loadAudioCatalog(nwbtBaseUrl)
    catalog.catch(() => (catalog = null))
  }
  return catalog
}

const banks = new Map<string, Promise<WwiseBank | null>>()
function loadBank(name: string): Promise<WwiseBank | null> {
  let bank = banks.get(name)
  if (!bank) {
    bank = fetch(filesUrl(`${BANK_FOLDER}/${name}`))
      .then(async (res) => (res.ok ? parseWwiseBank(new Uint8Array(await res.arrayBuffer())) : null))
      .catch(() => null)
    banks.set(name, bank)
  }
  return bank
}

/**
 * One media an audio trigger can play
 */
export interface TriggerMedia {
  id: number
  event: string
  load: MediaLoader
}

const resolved = new Map<string, Promise<TriggerMedia[]>>()

/**
 * The media an audio trigger can play, empty when none is found
 */
export function triggerMedia(trigger: string): Promise<TriggerMedia[]> {
  const id = trigger.toLowerCase()
  let result = resolved.get(id)
  if (!result) {
    result = resolve(trigger)
    result.catch(() => resolved.delete(id))
    resolved.set(id, result)
  }
  return result
}

async function resolve(trigger: string): Promise<TriggerMedia[]> {
  const audio = await audioCatalog()
  const atl = audio.atl.triggers.get(trigger.toLowerCase())
  const events = atl?.events.length ? atl.events : [trigger]
  const bankNames = new Set<string>()
  for (const name of [trigger, ...events]) {
    for (const bank of audio.triggerBanks.banksForEvent(name)) {
      bankNames.add(bank)
    }
  }
  const loaded: Array<{ name: string; bank: WwiseBank }> = []
  for (const name of bankNames) {
    const bank = await loadBank(name)
    if (bank) {
      loaded.push({ name, bank })
    }
  }
  const names = new Map(events.map((event) => [wwiseShortId(event), event]))
  const byMedia = mediaEventNames(
    loaded.map((it) => it.bank),
    names,
  )
  // where a media is: embedded in one of the banks, or a loose `.wem` that a bank streams
  const loaders = new Map<number, MediaLoader>()
  for (const { name, bank } of loaded) {
    for (const media of bankContents(bank, `${BANK_FOLDER}/${name}`).media) {
      if (loaders.has(media.id) || !byMedia.has(media.id)) {
        continue
      }
      if (media.kind === 'embedded') {
        loaders.set(media.id, async () => getWwiseBankMedia(bank, media.id) ?? new Uint8Array())
      } else if (media.path) {
        const path = media.path
        loaders.set(media.id, (signal) => fileBytes(path, signal))
      }
    }
  }
  const result: TriggerMedia[] = []
  for (const [mediaId, mediaEvents] of byMedia) {
    const load = loaders.get(mediaId)
    if (load) {
      result.push({ id: mediaId, event: mediaEvents[0], load })
    }
  }
  return result
}

/**
 * Localization of the Data tool: `@key` cells resolved by the `.loc.xml` files of one language. The files are found
 * by their extension in the catalog; the language is the folder they are in (`<lang>/<name>.loc.xml`).
 */
import { createSignal } from 'solid-js'
import { searchFiles } from '../../api/browse'
import { parseLocXml } from '../../formats/loc/loc'
import { fileBytes } from '../browser/views/content'

const PREFERRED_LANGUAGE = 'en-us'
const PARALLEL_FILES = 8

/**
 * Loc files by language folder
 */
let files: Promise<Map<string, string[]>> | null = null

function locFiles() {
  if (!files) {
    files = searchFiles('.loc.xml', [], undefined, 20000).then((result) => {
      const byLanguage = new Map<string, string[]>()
      for (const file of result.files) {
        if (!file.path.toLowerCase().endsWith('.loc.xml')) {
          continue
        }
        const parts = file.path.split('/')
        const language = parts.length > 1 ? parts[parts.length - 2] : ''
        const list = byLanguage.get(language) ?? []
        list.push(file.path)
        byLanguage.set(language, list)
      }
      return byLanguage
    })
    files.catch(() => (files = null))
  }
  return files
}

/**
 * The languages that have loc files, sorted
 */
export async function locLanguages(): Promise<string[]> {
  return [...(await locFiles()).keys()].sort()
}

const [language, setLanguageSignal] = createSignal<string | null>(null)
/**
 * The strings of the selected language, by lowercase key without `@`; null until loaded
 */
const [strings, setStrings] = createSignal<Map<string, string> | null>(null)
let loading: Promise<void> | null = null
let loadingLanguage: string | null = null

/**
 * The selected language, null until the first loc cell asks for one
 */
export { language as locLanguage }

/**
 * Selects the language and loads its strings
 */
export function setLocLanguage(value: string) {
  setLanguageSignal(value)
  void load(value)
}

async function load(value: string) {
  if (loadingLanguage === value && loading) {
    return loading
  }
  loadingLanguage = value
  setStrings(null)
  loading = (async () => {
    const paths = (await locFiles()).get(value) ?? []
    const result = new Map<string, string>()
    let next = 0
    const worker = async () => {
      while (next < paths.length) {
        const path = paths[next++]
        try {
          const text = new TextDecoder().decode(await fileBytes(path))
          for (const it of parseLocXml(text)) {
            result.set(it.key.toLowerCase(), it.value)
          }
        } catch (err) {
          console.warn('loc file not read:', path, String(err))
        }
      }
    }
    await Promise.all(Array.from({ length: PARALLEL_FILES }, worker))
    if (loadingLanguage === value) {
      setStrings(result)
    }
  })()
  return loading
}

/**
 * Starts loading the preferred language (or the first one) unless a language is selected
 */
export function ensureLoc() {
  if (language() != null) {
    return
  }
  void locLanguages().then((languages) => {
    if (language() == null && languages.length) {
      setLocLanguage(languages.includes(PREFERRED_LANGUAGE) ? PREFERRED_LANGUAGE : languages[0])
    }
  })
}

/**
 * The text of a loc key (`@ui_name` or `ui_name`). Undefined while loading or when the key is unknown. Reactive:
 * reads the loaded strings.
 */
export function locText(key: string): string | undefined {
  const map = strings()
  if (!map) {
    return undefined
  }
  return map.get((key.startsWith('@') ? key.slice(1) : key).toLowerCase())
}

/**
 * Whether the strings of the selected language are loaded (reactive)
 */
export function locReady() {
  return strings() != null
}

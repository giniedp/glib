import { fileUrl } from '../../../api/browse'

/**
 * What a file holds, from its first bytes. Many xml typed products are binary object streams, so the
 * type alone does not tell.
 */
export type ContentKind = 'text' | 'objectstream' | 'objectstream-xml' | 'binary'

/**
 * Bytes read to tell the kind, the rest of the file is not downloaded for it
 */
const SNIFF_BYTES = 64 * 1024

const kinds = new Map<string, Promise<ContentKind>>()
const contents = new Map<string, Promise<Uint8Array>>()

/**
 * The kind of a file's content. Reads only its start: the download is cancelled after it.
 */
export function contentKind(path: string): Promise<ContentKind> {
  let kind = kinds.get(path)
  if (!kind) {
    kind = readHead(path).then(sniff)
    kind.catch(() => kinds.delete(path))
    kinds.set(path, kind)
  }
  return kind
}

/**
 * The raw bytes of a file (`/files/<path>`, a dds unmerged). Loaded once and shared by the views of
 * a tab until {@link releaseContent}.
 */
export function contentBytes(path: string): Promise<Uint8Array> {
  let bytes = contents.get(path)
  if (!bytes) {
    bytes = fetchOk(path).then(async (res) => new Uint8Array(await res.arrayBuffer()))
    bytes.catch(() => contents.delete(path))
    contents.set(path, bytes)
  }
  return bytes
}

/**
 * Drops the cached content of a file, e.g. when its tab closes
 */
export function releaseContent(path: string) {
  kinds.delete(path)
  contents.delete(path)
}

/**
 * The raw bytes of a file, not cached (e.g. the split parts of a texture, which only the assembly reads)
 */
export async function fileBytes(path: string, signal?: AbortSignal): Promise<Uint8Array> {
  const res = await fetchOk(path, signal)
  return new Uint8Array(await res.arrayBuffer())
}

async function fetchOk(path: string, signal?: AbortSignal) {
  const res = await fetch(fileUrl(path), { signal })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return res
}

async function readHead(path: string): Promise<Uint8Array> {
  // the whole file may be cached already
  const cached = contents.get(path)
  if (cached) {
    return (await cached).subarray(0, SNIFF_BYTES)
  }
  const res = await fetchOk(path)
  if (!res.body) {
    return new Uint8Array(await res.arrayBuffer()).subarray(0, SNIFF_BYTES)
  }
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (length < SNIFF_BYTES) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      chunks.push(value)
      length += value.length
    }
  } finally {
    reader.cancel().catch(() => {})
  }
  const head = new Uint8Array(Math.min(length, SNIFF_BYTES))
  let at = 0
  for (const chunk of chunks) {
    const part = chunk.subarray(0, head.length - at)
    head.set(part, at)
    at += part.length
    if (at >= head.length) {
      break
    }
  }
  return head
}

const XML_OBJECT_STREAM = new TextEncoder().encode('<ObjectStream')

/**
 * The kind of content from its first bytes, like nwbt (formats/azcs: IsBinaryObjectStream, IsXmlObjectStream)
 */
export function sniff(head: Uint8Array): ContentKind {
  // binary object stream: 4 zero bytes and the version 1, 2 or 3
  if (head.length >= 5 && head[0] === 0 && head[1] === 0 && head[2] === 0 && head[3] === 0 && head[4] >= 1 && head[4] <= 3) {
    return 'objectstream'
  }
  if (startsWith(head, XML_OBJECT_STREAM)) {
    return 'objectstream-xml'
  }
  if (head.length === 0 || head.includes(0)) {
    return head.length === 0 ? 'text' : 'binary'
  }
  try {
    // stream: the head may end in the middle of a character. A new decoder each time, a streaming
    // decoder keeps the incomplete end for its next call.
    new TextDecoder('utf-8', { fatal: true }).decode(head, { stream: true })
    return 'text'
  } catch {
    return 'binary'
  }
}

function startsWith(bytes: Uint8Array, prefix: Uint8Array) {
  if (bytes.length < prefix.length) {
    return false
  }
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[i] !== prefix[i]) {
      return false
    }
  }
  return true
}

import { createResource, lazy, Match, Show, Suspense, Switch } from 'solid-js'
import { convertedText, type TextConversion } from '../../../api/browse'
import { sheetToJson } from '../../../formats/datasheet/analysis'
import { formatBytes } from '../../common/format'
import { contentBytes } from './content'
import type { ViewContext } from './registry'

// monaco is large: loaded with the first text view
const CodeEditor = lazy(() => import('../../common/CodeEditor'))

/**
 * Text larger than this is cut, monaco gets slow
 */
const TEXT_LIMIT = 8 * 1024 * 1024

interface Text {
  text: string
  /**
   * Size of the whole text, more than `text` when it was cut
   */
  size: number
}

/**
 * A view that shows text in a read-only editor. `source` is where the text comes from: the raw file or a
 * conversion of nwbt.
 */
function codeMode(
  source: (ctx: ViewContext) => Promise<string>,
  language: (ctx: ViewContext, text: string) => string,
) {
  return function CodeMode(props: { ctx: ViewContext }) {
    // keyed by path and kind: the context object is recreated, e.g. when the types load
    const [text] = createResource(
      () => `${props.ctx.kind}:${props.ctx.path}`,
      async (): Promise<Text> => {
        const full = await source(props.ctx)
        return { text: full.length > TEXT_LIMIT ? full.slice(0, TEXT_LIMIT) : full, size: full.length }
      },
    )
    const reading = (
      <div class="nw-empty">
        <p class="nw-note">Reading…</p>
      </div>
    )
    return (
      <Switch fallback={reading}>
        <Match when={text.error}>
          <div class="nw-empty">
            <p class="nw-note">Could not be read: {text.error instanceof Error ? text.error.message : String(text.error)}</p>
          </div>
        </Match>
        <Match when={text()}>
          {(loaded) => (
            <>
              <Show when={loaded().size > loaded().text.length}>
                <p class="nw-note">
                  Showing the first {formatBytes(loaded().text.length)} of {formatBytes(loaded().size)}.
                </p>
              </Show>
              <Suspense fallback={reading}>
                <CodeEditor text={loaded().text} language={language(props.ctx, loaded().text)} />
              </Suspense>
            </>
          )}
        </Match>
      </Switch>
    )
  }
}

function decodeText(bytes: Uint8Array) {
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Monaco language of a text file: by its extension, else xml if the text starts with a tag (many xml files
 * have their own extension: mtl, cdf, chrparams, ent, …)
 */
export function languageOf(path: string, text: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1)
  switch (ext) {
    case 'json':
      return 'json'
    case 'lua':
      return 'lua'
    case 'cfg':
    case 'ini':
      return 'ini'
    case 'xml':
      return 'xml'
  }
  return /^﻿?\s*</.test(text.slice(0, 256)) ? 'xml' : 'plaintext'
}

/**
 * Text files as they are
 */
export const TextMode = codeMode(
  async (ctx) => decodeText(await contentBytes(ctx.path)),
  (ctx, text) => languageOf(ctx.path, text),
)

/**
 * An object stream as xml: an xml object stream as it is, a binary one converted by nwbt
 */
export const XmlMode = codeMode(
  async (ctx) => (ctx.kind === 'objectstream-xml' ? decodeText(await contentBytes(ctx.path)) : convertedText(ctx.path, 'xml')),
  () => 'xml',
)

function converted(conversion: TextConversion) {
  return (ctx: ViewContext) => convertedText(ctx.path, conversion)
}

/**
 * An object stream as json, converted by nwbt
 */
export const JsonMode = codeMode(converted('json'), () => 'json')

/**
 * A compiled lua script, decompiled by nwbt (unluac)
 */
export const LuaMode = codeMode(converted('lua'), () => 'lua')

/**
 * A datasheet as json, from the sheet parsed in the frontend
 */
export const SheetJsonMode = codeMode(async (ctx) => sheetToJson(ctx.sheet.sheet), () => 'json')

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const docsRoot = fileURLToPath(new URL('..', import.meta.url)).replace(/\\/g, '/').replace(/\/$/, '')
const exampleCodeTag = /<ExampleCode\b([^>]*?)\s*\/>/g
const exampleTag = /<Example\b[^>]*\/>/
const srcAttr = /\bsrc\s*=\s*(["'])(.*?)\1/
const tabsOpen = /^\s*:::tabs\b/
const tabsClose = /^\s*:::\s*$/
const tabLabel = /^\s*==\s*(.*?)\s*$/
const fenceLine = /^\s*(`{3,}|~{3,})/

const demoNote = '_Interactive demo, runs in the browser on this page._'

/**
 * Prepares the example pages for humans and for LLMs:
 *
 * - inlines the source of each `<ExampleCode />` tag as a `?raw` import, so the component renders the code during SSR
 *   and each page only bundles its own sources
 * - adds an `<llm-only>` view with the sources as plain fenced code blocks (picked up by vitepress-plugin-llms).
 *   Tab containers are swapped completely (`<llm-exclude>` for the original), since the `:::tabs` syntax would
 *   otherwise leak into the llm output as text.
 *
 * Must be registered before `vitepress-plugin-llms`, which collects the content as transformed by this plugin.
 */
export function exampleCodePlugin(): Plugin {
  return {
    name: 'example-code',
    enforce: 'pre',
    transform(code, id) {
      const file = id.replace(/\\/g, '/')
      if (!file.endsWith('.md') || !file.startsWith(docsRoot + '/') || !/<Example|:::tabs/.test(code)) {
        return null
      }
      if (/<script\s+setup\b/.test(code)) {
        this.error(`example-code: ${file} already has a <script setup> block, merging is not supported`)
      }

      const fileDir = path.posix.dirname(file)
      const imports: string[] = []
      const resolve = (attrs: string) => {
        const src = attrs.match(srcAttr)?.[2]
        const resolved = resolveExample(file, src)
        if (!resolved) {
          this.error(`example-code: no example source found for ${file} (src: ${src ?? '<default>'})`)
        }
        // the llm view reads the file directly, re-transform the page when it changes
        this.addWatchFile(resolved)
        return resolved
      }
      // human view: <ExampleCode src="..." :code="__exampleN" />
      const toComponent = (line: string) => {
        return line.replace(exampleCodeTag, (_, attrs: string) => {
          const resolved = resolve(attrs)
          const name = `__example${imports.length}`
          const rel = path.posix.relative(fileDir, resolved)
          imports.push(`import ${name} from '${rel.startsWith('.') ? rel : './' + rel}?raw'`)
          const rest = attrs.replace(srcAttr, '').trim()
          return `<ExampleCode src="${path.posix.basename(resolved)}" :code="${name}"${rest ? ' ' + rest : ''} />`
        })
      }
      // llm view: plain fenced code blocks
      const toFences = (line: string, label?: string) => {
        const blocks: string[] = []
        for (const match of line.matchAll(exampleCodeTag)) {
          const resolved = resolve(match[1])
          blocks.push(fence(fs.readFileSync(resolved, 'utf-8'), label || path.posix.basename(resolved)))
        }
        return blocks
      }

      const lines = code.split(/\r?\n/)
      const out: string[] = []
      let inFence: string | null = null
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        const fenceMatch = line.match(fenceLine)
        if (inFence) {
          if (fenceMatch && fenceMatch[1][0] === inFence[0] && fenceMatch[1].length >= inFence.length) {
            inFence = null
          }
          out.push(line)
          continue
        }
        if (fenceMatch) {
          inFence = fenceMatch[1]
          out.push(line)
          continue
        }

        if (tabsOpen.test(line)) {
          let end = i + 1
          while (end < lines.length && !tabsClose.test(lines[end])) {
            end++
          }
          const block = lines.slice(i, end + 1)
          out.push('<llm-exclude>', '', ...block.map(toComponent), '', '</llm-exclude>', '', '<llm-only>', '')
          out.push(...tabsToLlm(block.slice(1, -1), toFences))
          out.push('', '</llm-only>')
          i = end
          continue
        }

        if (line.includes('<ExampleCode')) {
          out.push(toComponent(line), '', '<llm-only>', '', ...toFences(line), '', '</llm-only>', '')
          continue
        }
        if (exampleTag.test(line)) {
          out.push(line, '', '<llm-only>', '', demoNote, '', '</llm-only>', '')
          continue
        }
        out.push(line)
      }

      if (imports.length) {
        out.push('', '<script setup>', ...imports, '</script>', '')
      }
      return {
        code: out.join('\n'),
        map: null,
      }
    },
  }
}

/**
 * Converts the body of a `:::tabs` container into plain markdown. A `== label` section holding an `<ExampleCode />`
 * becomes a code block titled with the label, any other section keeps its content below a bold label line.
 */
function tabsToLlm(body: string[], toFences: (line: string, label?: string) => string[]) {
  const sections: Array<{ label?: string; lines: string[] }> = [{ lines: [] }]
  for (const line of body) {
    const labelMatch = line.match(tabLabel)
    if (labelMatch) {
      sections.push({ label: labelMatch[1], lines: [] })
    } else {
      sections[sections.length - 1].lines.push(line)
    }
  }

  const out: string[] = []
  for (const { label, lines } of sections) {
    const hasCode = lines.some((it) => it.includes('<ExampleCode'))
    if (label && !hasCode && lines.some((it) => it.trim())) {
      out.push('', `**${label}**`, '')
    }
    for (const line of lines) {
      if (line.includes('<ExampleCode')) {
        out.push('', ...toFences(line, label), '')
      } else if (exampleTag.test(line)) {
        out.push('', demoNote, '')
      } else {
        out.push(line)
      }
    }
  }
  return out
}

function fence(source: string, title: string) {
  const longest = Math.max(0, ...(source.match(/`+/g) ?? []).map((it) => it.length))
  const ticks = '`'.repeat(Math.max(3, longest + 1))
  return `${ticks}ts [${title}]\n${source.replace(/\s+$/, '')}\n${ticks}`
}

/**
 * Same candidate order as the former client side lookup, with the page url derived from the markdown file path
 */
function resolveExample(file: string, src: string | undefined): string | null {
  const relative = file.slice(docsRoot.length).replace(/\.md$/, '')
  const page = relative.endsWith('/index') ? relative.slice(0, -'index'.length) : relative
  const dir = page.endsWith('/') ? page : path.posix.dirname(page) + '/'

  const candidates = src
    ? [dir + src, page.replace(/\/$/, '') + '/' + src]
    : [page + 'example.ts', page + '.example.ts', page.replace(/\/$/, '') + '/example.ts']

  for (const candidate of candidates) {
    const full = docsRoot + path.posix.normalize(candidate)
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      return full
    }
  }
  return null
}

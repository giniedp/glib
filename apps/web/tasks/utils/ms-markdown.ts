import * as path from 'path'
import * as Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import MarkdownIt from 'markdown-it'
import Metalsmith from "metalsmith"
import { MetalsmithFileMeta } from "./ms-metadata"
import minimatch from 'minimatch'
import wplog from 'webpack-log'

const log = wplog({
  name: 'ms-markdown',
  timestamp: true,
})

export function highlight(code: string, options?: string | { lang: string }) {
  const lang: string = (typeof options === "string" ? options : options?.lang) || 'typescript'
  let grammar = Prism.languages[lang]
  if (!grammar) {
    try {
      require(`prismjs/components/prism-${lang}.js`)
      grammar = Prism.languages[lang]
    } catch (e) {
      //
    }
  }
  if (!grammar) {
    log.warn('grammar not available:', lang)
    return code
  }
  return Prism.highlight(code, grammar, lang)
}

export default (config: {
  match: string,
  options?: Record<string, any>,
}) => {
  const match = config.match || ''
  const options = config.options || {}
  options.highlight = options.highlight || highlight
  const md = new MarkdownIt(options)
  applyPatch(md)
  return (files: Record<string, MetalsmithFileMeta>, smith: Metalsmith, done: Function) => {
    for (const file in files) {
      if (!file.endsWith('.md')) {
        continue
      }
      if (match && !minimatch(file, match)) {
        continue
      }
      try {
        const content = md.render(files[file].contents.toString())
        files[file].contents = Buffer.from(content)
        files[file.replace(/\.md$/, '.html')] = files[file]
      } catch (e) {
        log.error('failed to trainspile file', path.join(smith.source(), file), '\n', e)
      }
      delete files[file]
    }
    done()
  }
}

function applyPatch(md: any) {
  function patch(name, custom) {
    const orig = md.renderer.rules[name] || ((tokens, idx, options, env, self) => {
      return self.renderToken(tokens, idx, options)
    })
    md.renderer.rules[name] = (...args: any[]) => {
      custom(...args)
      return orig(...args)
    }
  }

  patch('link_open', (tokens: any[], idx: number, options, env, self) => {
    const token = tokens[idx]
    const aIndex = token.attrIndex('href')
    if (aIndex >= 0) {
      const value: string = token.attrs[aIndex][1]
      token.attrs[aIndex][1] = value.replace(/\.md$/, '.html')
    }
  })

  patch('heading_open', (tokens: any[], idx: number, options, env, self) => {
    const token = tokens[idx]
    const child = tokens[idx + 1]
    const content: string = child ? child.content : null
    if (content) {
      token.attrJoin('class', content.replace(/\s+/ig, '-').toLowerCase().replace(/[^a-z]+/, '_'))
    }
  })

  patch('table_open', (tokens: any[], idx: number) => {
    tokens[idx].attrJoin('class', 'table table-borderless mb-4')
  })

}

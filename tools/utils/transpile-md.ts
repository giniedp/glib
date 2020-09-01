import * as Prism from 'prismjs'
const loadLanguages = require('prismjs/components/') // tslint:line: no-submodule-imports
loadLanguages(['typescript', 'glsl'])

const md = require('markdown-it')({
  html: true,
  highlight: (code: string, lang: string) => {
    lang = lang || 'typescript'
    if (!Prism.languages[lang]) {
      console.warn(`prism language ${lang} not enabled. Fallback to javascript`)
      lang = 'javascript'
    }
    return Prism.highlight(code, Prism.languages[lang], lang)
  },
})

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

export function transpileMd(content: string) {
  return md.render(content)
}

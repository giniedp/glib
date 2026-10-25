<template>
  <div class="language-ts example-code">
    <!-- VitePress' global copy handler copies the textContent of button.copy's 2nd next sibling (the pre),
         skipping .vp-copy-ignore nodes (line numbers, region markers) -->
    <button title="Copy Code" class="copy"></button>
    <span class="lang">ts</span>
    <pre><code v-html="highlightedCode"></code></pre>
  </div>
</template>
<style>
pre {
  overflow: auto;
}
.vp-doc .example-code code {
  padding-left: 0;
}
.example-code .line {
  display: block;
}
.example-code .nl {
  display: none;
}
.example-code .ln {
  position: sticky;
  left: 0;
  z-index: 1;
  display: inline-block;
  width: 40px;
  margin-right: 16px;
  padding-right: 8px;
  text-align: right;
  color: var(--vp-code-line-number-color);
  background: var(--vp-code-block-bg);
  border-right: 1px solid var(--vp-code-block-divider-color);
  user-select: none;
}
.example-code .region > summary {
  display: block;
  cursor: pointer;
  list-style: none;
  color: var(--vp-code-line-number-color);
}
.example-code .region > summary::-webkit-details-marker {
  display: none;
}
.example-code .region > summary:hover {
  color: var(--vp-c-text-1);
}
.example-code .region > summary .ln::before {
  content: '▾';
}
.example-code .region:not([open]) > summary .ln::before {
  content: '▸';
}
.example-code .region:not([open]) > summary .region-name::after {
  content: ' …';
}
</style>
<script setup lang="ts">
import hljs from 'highlight.js'
import ts from 'highlight.js/lib/languages/typescript'
import 'highlight.js/styles/github-dark.css'
import { computed } from 'vue'
hljs.registerLanguage('typescript', ts)

// `code` is injected at build time by the example-code vite plugin (see .vitepress/example-code-plugin.ts)
const props = defineProps({
  src: String,
  code: String,
})

const highlightedCode = computed(() => {
  if (!props.code) {
    return ''
  }
  return renderLines(props.code, classifyComments(hljs.highlight(props.code, { language: 'typescript' }).value))
})

// `// #region name` … `// #endregion` lines become collapsible blocks (collapsed by default).
// Marker lines are not numbered and not copied, so line numbers match the copied source.
const REGION = /^([ \t]*)\/\/\s*#(end)?region\b[ \t]*(.*)$/

function renderLines(code: string, html: string) {
  const src = code.replace(/\r?\n$/, '').split(/\r?\n/)
  const lines = splitHtmlLines(html)
  let n = 0
  let depth = 0
  let out = ''
  src.forEach((line, i) => {
    const m = line.match(REGION)
    if (m?.[2]) {
      if (depth > 0) {
        depth--
        out += '</div></details>'
      }
    } else if (m) {
      depth++
      out +=
        '<details class="region"><summary class="vp-copy-ignore"><span class="ln"></span>' +
        `${m[1]}<span class="region-name">${escapeHtml(m[3].trim() || 'region')}</span></summary><div>`
    } else {
      out += `<span class="line"><span class="ln vp-copy-ignore" aria-hidden="true">${++n}</span>${lines[i] ?? ''}<span class="nl">\n</span></span>`
    }
  })
  return out + '</div></details>'.repeat(depth)
}

// splits highlight.js output into lines, closing open spans at each line end and reopening them on the next
function splitHtmlLines(html: string) {
  const lines: string[] = []
  const open: string[] = []
  let current = ''
  for (const [token] of html.matchAll(/<span[^>]*>|<\/span>|\r?\n|[^<\r\n]+/g)) {
    if (token.startsWith('<span')) {
      open.push(token)
      current += token
    } else if (token === '</span>') {
      open.pop()
      current += token
    } else if (token.endsWith('\n')) {
      lines.push(current + '</span>'.repeat(open.length))
      current = open.join('')
    } else {
      current += token
    }
  }
  lines.push(current)
  return lines
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function classifyComments(html: string) {
  // 1) pragmas — unchanged
  html = html.replace(
    /<span class="hljs-comment">((?:\/\/|\/\*)\s*(?:prettier-ignore|eslint-[\w-]+|@ts-(?:ignore|expect-error|nocheck)|biome-ignore)[^<]*?(?:\*\/)?)<\/span>/g,
    '<span class="hljs-comment hljs-comment--pragma">$1</span>',
  )

  // 2) language markers — unchanged
  html = html.replace(
    /<span class="hljs-comment">(\/\*\s*[\w-]+\s*\*\/)<\/span>/g,
    '<span class="hljs-comment hljs-comment--marker">$1</span>',
  )

  // 3a) line comments at line start → doc (// always runs to EOL, so this is safe)
  html = html.replace(
    /(^|\n)([ \t]*)<span class="hljs-comment">\/\//g,
    '$1$2<span class="hljs-comment hljs-comment--doc hljs-comment--line">//',
  )

  // 3b) single-line block comment that both starts AND ends its line → doc
  html = html.replace(
    /(^|\n)([ \t]*)<span class="hljs-comment">(\/\*[^<\n]*?\*\/)<\/span>(?=[ \t]*(?:\n|$))/g,
    '$1$2<span class="hljs-comment hljs-comment--doc hljs-comment--block">$3</span>',
  )

  // 3c) any remaining single-line block comment shares its line with code
  //     (leading, mid, or trailing — all the same thing now) → inline
  html = html.replace(
    /<span class="hljs-comment">(\/\*[^<\n]*?\*\/)<\/span>/g,
    '<span class="hljs-comment hljs-comment--inline">$1</span>',
  )

  // 3d) remaining block openers at line start are multi-line blocks → doc
  html = html.replace(
    /(^|\n)([ \t]*)<span class="hljs-comment">\/\*/g,
    '$1$2<span class="hljs-comment hljs-comment--doc hljs-comment--block">/*',
  )

  // 4) leftovers = trailing // comments after code → inline
  html = html.replace(/<span class="hljs-comment">/g, '<span class="hljs-comment hljs-comment--inline">')

  // 5) wrap comment delimiters so CSS can hide them (they stay in the DOM → stay in copy)
  // leading  "// " | "/* " | "/** "  right after any comment span opens
  html = html.replace(/(<span class="hljs-comment[^"]*">)(\/\/\s?|\/\*+\s?)/g, '$1<span class="hljs-cdelim">$2</span>')

  // trailing " */" right before a closing tag
  html = html.replace(/(\s?\*+\/)(<\/span>)/g, '<span class="hljs-cdelim">$1</span>$2')

  return html
}
</script>

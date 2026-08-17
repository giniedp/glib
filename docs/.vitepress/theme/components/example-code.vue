<template>
  <div v-if="code">
    <pre><code v-html="highlightedCode"></code></pre>
  </div>
</template>
<style>
pre {
  overflow: auto;
}
</style>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import hljs from 'highlight.js'
import ts from 'highlight.js/lib/languages/typescript'
import 'highlight.js/styles/github-dark.css'
import { mergeUri, withResolvers } from '@gglib/utils'
hljs.registerLanguage('typescript', ts)

const rawExamples = import.meta.glob('/**/*.ts', { query: '?raw' })

const props = defineProps({
  name: String,
})
function getExample() {
  let pathname = location.pathname
  if (pathname.endsWith('.html')) {
    pathname = pathname.replace('.html', '')
  }

  let result: string = null!
  if (!props.name) {
    const name1 = pathname + 'example.ts'
    const name2 = pathname + '.example.ts'
    result = rawExamples[name1] || rawExamples[name2]
    if (!result) {
      throw new Error(`example does not exist: ${name1} (${name2})`)
    }
  } else {
    const name = mergeUri(pathname, props.name)
    result = rawExamples[name]
    if (!result) {
      throw new Error(`example does not exist: ${name}`)
    }
  }

  return result
}

const code = ref('')
const highlightedCode = ref('')

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

onMounted(async () => {
  try {
    const exampleLoader = getExample()
    const module: any = await exampleLoader()
    const raw = module.default
    code.value = raw
    highlightedCode.value = classifyComments(hljs.highlight(raw, { language: 'typescript' }).value)
  } catch (e) {
    console.error(e)
  }
})
</script>

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
import hljs from 'highlight.js';
import ts from 'highlight.js/lib/languages/typescript';
import 'highlight.js/styles/github-dark.css'
hljs.registerLanguage('typescript', ts);

const rawExamples = import.meta.glob('/**/example*.ts', { query: '?raw' });

const props = defineProps({
  name: String
})

const code = ref('')
const highlightedCode = ref('')

onMounted(async () => {
  try {
    const exampleName = location.pathname + (props.name || 'example.ts')
    const exampleLoader = rawExamples[exampleName]
    const module = await exampleLoader()
    const raw = module.default
    code.value = raw
    highlightedCode.value = hljs.highlight(raw, { language: 'typescript' }).value
  } catch (e) {
    console.error(e)
  }

})

</script>

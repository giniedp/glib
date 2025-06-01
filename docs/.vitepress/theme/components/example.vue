<template>
  <div class="example-frame" ref="frame">
    <canvas ref="canvas" style="width: 100%; height: 100%; z-index: 1;"></canvas>
    <div class="example-tools">
      <div>
        <div ref="fsTools"></div>
        <div ref="tools"></div>
      </div>
    </div>
  </div>

</template>

<style>
.example-frame {
  width: 100%;
  aspect-ratio: 16/9;
  position: relative;
}

.example-tools {
  position: absolute;
  top: 0;
  right: 0;
  max-height: 100%;
  overflow: auto;
  z-index: 1;
  opacity: 0;
}
.example-frame:hover .example-tools {
  opacity: 0.25 !important;
}
.example-frame:hover .example-tools:hover {
  opacity: 0.8 !important;
}

canvas {
  background-color: black;
}

</style>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import * as TweakUi from 'tweak-ui'
export type RunFn = (canvas: HTMLCanvasElement, tools: HTMLElement) => RunDisposeFn
export type RunDisposeFn = () => void

const examples = import.meta.glob('/**/example*.ts');
const rawExamples = import.meta.glob('/**/example*.ts', { query: '?raw' });

const frame = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const fsTools = ref<HTMLElement | null>(null)
const tools = ref<HTMLElement | null>(null)
const props = defineProps({
  name: String
})
let toDispose: RunDisposeFn | null = null
let isMounted = false
onMounted(async () => {
  isMounted = true
  try {
    const exampleName = location.pathname + (props.name || 'example.ts')
    const exampleLoader = examples[exampleName]
    const module = await exampleLoader()
    if (isMounted) {
      toDispose = module.default(canvas.value, tools.value) || null
    }
  } catch (e) {
    console.error(e)
  }

  TweakUi.mount(fsTools.value, (ui) => {
    ui.button('Fullscreen', { onClick: toggleFullscreen })
  })
})

onUnmounted(() => {
  isMounted = false
  if (toDispose) {
    toDispose()
    toDispose = null
  }
})
function toggleFullscreen() {
  const elem = frame.value
  if (!elem) {
    return
  }
  if (document.fullscreenElement) {
    document.exitFullscreen()
    return
  }
  elem.requestFullscreen()
}
</script>

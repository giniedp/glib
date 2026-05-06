<template>
  <div class="example-frame" ref="frame">
    <canvas ref="canvas" style="width: 100%; height: 100%; z-index: 1"></canvas>
    <div class="example-tools twui-dark" @mousedown="stopPropagation">
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
  --twui-radius: 0;
  --twui-gap: 0;
}
.example-frame:hover .example-tools {
  opacity: 0.25 !important;
}
.example-frame:hover .example-tools:hover {
  opacity: 0.9 !important;
}

canvas {
  background-color: black;
}
</style>
<script setup lang="ts">
import { mountUi } from 'tweak-ui'
import { onMounted, onUnmounted, ref } from 'vue'
export type RunFn = (canvas: HTMLCanvasElement, tools: HTMLElement) => RunDisposeFn
export type RunDisposeFn = () => void

const examples = import.meta.glob('/**/example*.ts')
const rawExamples = import.meta.glob('/**/example*.ts', { query: '?raw' })

const frame = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const fsTools = ref<HTMLElement | null>(null)
const tools = ref<HTMLElement | null>(null)
const props = defineProps({
  name: String,
  platform: String,
})
let toDispose: RunDisposeFn | null = null
let isMounted = false
onMounted(async () => {
  isMounted = true
  try {
    const exampleName = location.pathname + (props.name || 'example.ts')
    const exampleLoader = examples[exampleName]
    if (!exampleLoader) {
      throw new Error(`example does not exist: ${exampleName}`)
    }
    const module = await exampleLoader()
    if (isMounted) {
      toDispose = module.default(canvas.value, tools.value, props.platform) || null
    }
  } catch (e) {
    console.error(e)
  }

  mountUi(fsTools.value!, (ui) => {
    ui.button('Fullscreen', { onclick: toggleFullscreen })
  })
})

onUnmounted(() => {
  isMounted = false
  if (toDispose) {
    Promise.resolve(toDispose).then((dispose) => dispose())
    toDispose = null
  }
})

function stopPropagation(event: MouseEvent) {
  event.stopPropagation()
}

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

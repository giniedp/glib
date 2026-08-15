<template>
  <div class="example-frame" ref="frame">
    <canvas ref="canvas" style="width: 100%; height: 100%; z-index: 1"></canvas>
    <div class="example-tools twk-dark" @mousedown="stopPropagation" @wheel="stopPropagation">
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
  --twk-radius: 0;
  --twk-gap: 0;
}
.example-frame:hover .example-tools {
  opacity: 0.25 !important;
}
.example-frame:hover .example-tools:hover {
  opacity: 1 !important;
}

canvas {
  background-color: black;
}
</style>
<script setup lang="ts">
/// <reference types="vite/client" />
import { mountUi } from 'tweak-ui'
import { useRoute } from 'vitepress'
import { computed, onMounted, onUnmounted, ref } from 'vue'
export type RunFn = (canvas: HTMLCanvasElement, tools: HTMLElement) => RunDisposeFn
export type RunDisposeFn = () => void

const examples = import.meta.glob('/**/*.ts')
function getExamplePath() {
  let pathname = location.pathname
  if (pathname.endsWith('.html')) {
    pathname = pathname.replace('.html', '')
  }
  const name1 = pathname + (props.name || 'example.ts')
  const name2 = pathname + (props.name || '.example.ts')
  if (name1 in examples) {
    return name1
  }
  if (name2 in examples) {
    return name2
  }
  throw new Error(`example does not exist: ${name1} (${name2})`)
}

function getExample() {
  return examples[getExamplePath()]
}

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

const route = useRoute()
const showCapture = computed(() => import.meta.env.DEV && route.path.includes('/examples/'))

onMounted(async () => {
  isMounted = true
  try {
    const exampleLoader = getExample()
    const module: any = await exampleLoader()
    if (isMounted) {
      toDispose = module.default(canvas.value, tools.value, props.platform) || null
    }
  } catch (e) {
    console.error(e)
  }

  mountUi(fsTools.value!, (ui) => {
    if (showCapture.value) {
      ui.button('CAPTRUE', { onclick: captureCanvas })
    }
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

async function captureCanvas() {
  const blob = await new Promise<Blob | null>((resolve) => {
    ;(canvas.value as HTMLCanvasElement).toBlob(resolve, 'image/png')
  })

  if (!blob) {
    return
  }

  const query = new URLSearchParams()
  query.set('file', getExamplePath().replace(/\.ts$/, '.png'))
  const url = `/__capture?${query.toString()}`
  await fetch(url, { method: 'POST', body: blob })
}
</script>

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
  width: 100vw;
  aspect-ratio: 1/1;
  position: relative;
  margin-left: -24px;
}
@media (min-width: 640px) {
  .example-frame {
    width: 100%;
    margin-left: 0;
  }
}
@media (min-width: 768px) {
  .example-frame {
    width: 100%;
    aspect-ratio: 16/9;
    margin-left: 0;
  }
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

.example-frame {
  position: relative;
}

.example-frame:has(canvas.loading)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  margin: -16px 0 0 -16px;
  border: 3px solid rgba(0, 0, 0, 0.15);
  border-top-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  animation: example-frame-spin 0.8s linear infinite !important;
}

@keyframes example-frame-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
<script setup lang="ts">
/// <reference types="vite/client" />
import { PlatformId } from '@gglib/graphics'
import { mergeUri } from '@gglib/utils'
import { mountUi } from 'tweak-ui'
import { useRoute } from 'vitepress'
import { computed, onMounted, onUnmounted, ref } from 'vue'
export type RunFn = (canvas: HTMLCanvasElement, tools: HTMLElement) => RunDisposeFn
export type RunDisposeFn = () => void

const files = import.meta.glob('/**/*.ts')
type Example = {
  path: string
  load: () => Promise<unknown>
}
function getExample(): Example {
  let pathname = location.pathname
  if (pathname.endsWith('.html')) {
    pathname = pathname.replace('.html', '')
  }

  const paths: string[] = []
  if (!props.src) {
    paths.push(pathname + 'example.ts')
    paths.push(pathname + '.example.ts')
    paths.push(mergeUri('', 'example.ts', pathname))
  } else {
    paths.push(mergeUri(pathname, props.src))
    paths.push(mergeUri('', props.src, pathname))
  }
  for (const path of paths) {
    if (!files[path]) {
      continue
    }
    return {
      path,
      load: files[path],
    }
  }

  throw new Error(`example does not exist: ${paths}`)
}

const frame = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const fsTools = ref<HTMLElement | null>(null)
const tools = ref<HTMLElement | null>(null)
const props = defineProps({
  src: String,
  platform: String,
})
let toDispose: RunDisposeFn | null = null
let isMounted = false

const route = useRoute()
const showCapture = computed(() => import.meta.env.DEV && route.path.includes('/examples/'))

onMounted(async () => {
  isMounted = true
  loadExample(props.platform as any)
  mountUi(fsTools.value!, (ui) => {
    if (showCapture.value) {
      ui.button('CAPTRUE', { onclick: captureCanvas })
    }
    ui.button('Fullscreen', { onclick: toggleFullscreen })
  })
})

onUnmounted(() => {
  isMounted = false
  unloadExample()
})

async function loadExample(platform: PlatformId) {
  unloadExample()
  try {
    const module: any = await getExample().load()
    if (isMounted) {
      toDispose = module.default(canvas.value, tools.value, platform) || null
    }
  } catch (e) {
    console.error(e)
  }
}

function unloadExample() {
  if (!toDispose) {
    return
  }
  Promise.resolve(toDispose).then((dispose) => dispose())
  toDispose = null
}

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
  query.set('file', getExample().path.replace(/\.ts$/, '.png'))
  const url = `/__capture?${query.toString()}`
  await fetch(url, { method: 'POST', body: blob })
}
</script>

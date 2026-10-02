<template>
  <div class="example-frame" ref="frame">
    <div v-if="message" class="example-message">
      <p class="example-message-title">{{ message.title }}</p>
      <p v-if="message.detail">{{ message.detail }}</p>
    </div>
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
  top: 0.25rem;
  right: 0.25rem;
  max-height: 100%;
  overflow: auto;
  z-index: 1;
  /* opacity: 0; */
  --twk-radius: 0.125rem;
  --twk-gap: 0.125rem;
}
.example-tools > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.example-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 1rem;
  text-align: center;
  font-size: 14px;
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
}
.example-message p {
  margin: 0;
}
.example-message .example-message-title {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.example-frame {
  position: relative;
}

/* absolute, so the old and new canvas overlap and crossfade when switching */
.example-frame > canvas {
  position: absolute;
  inset: 0;
  opacity: 1;
  /* important: vitepress zeroes all transitions under prefers-reduced-motion, a fade is fine there */
  transition: opacity 300ms ease !important;
}
.example-frame > canvas.loading,
.example-frame > canvas.leaving {
  opacity: 0;
}

.example-frame:has(canvas.loading)::after,
.example-frame:has(canvas.content-loading)::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  margin: -16px 0 0 -16px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: rgba(255, 255, 255, 0.6);
  border-bottom-color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: example-frame-spin 0.8s linear infinite !important;
  z-index: 1;
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
import { mountUi, unmountUi } from 'tweak-ui'
import { useRoute } from 'vitepress'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { locationSearch } from '../location-search'
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
const fsTools = ref<HTMLElement | null>(null)
const tools = ref<HTMLElement | null>(null)
const props = defineProps({
  src: String,
  platform: String,
})
let toDispose: RunDisposeFn | null = null
let isMounted = false
let loadId = 0
let canvas: HTMLCanvasElement | null = null
// query string the running example was loaded with
let loadedSearch: string | null = null

// 'auto' allows switching between both platforms, a specific platform locks the other one
const requestedPlatform = (props.platform || 'auto') as PlatformId
const supportsWebGL2 = typeof WebGL2RenderingContext !== 'undefined'
let supportsWebGPU = false
let activePlatform: PlatformId = requestedPlatform

const message = ref<{ title: string; detail?: string } | null>(null)
const platformNames: Record<string, string> = {
  webgpu: 'WebGPU',
  webgl2: 'WebGL2',
}

// navigator.gpu may exist while no adapter is available (blocklisted GPU, disabled flag)
async function detectWebGPU() {
  try {
    return !!(await navigator.gpu?.requestAdapter())
  } catch {
    return false
  }
}

function isSupported(platform: PlatformId) {
  return platform === 'webgpu' ? supportsWebGPU : supportsWebGL2
}

const route = useRoute()
const showCapture = computed(() => import.meta.env.DEV && route.path.includes('/examples/'))

onMounted(async () => {
  isMounted = true
  supportsWebGPU = await detectWebGPU()
  if (!isMounted) {
    return
  }
  if (activePlatform === 'auto') {
    activePlatform = supportsWebGPU ? 'webgpu' : 'webgl2'
  }
  loadExample(activePlatform)
  mountUi(fsTools.value!, (ui) => {
    ui.flex({ flow: 'row' }, (ui) => {
      ui.button('WebGPU', {
        flex: '1',
        get accent() {
          return activePlatform === 'webgpu'
        },
        disabled: requestedPlatform === 'webgl2' || !supportsWebGPU,
        onclick: () => switchPlatform('webgpu'),
      })
      ui.button('WebGL', {
        flex: '1',
        get accent() {
          return activePlatform === 'webgl2'
        },
        disabled: requestedPlatform === 'webgpu' || !supportsWebGL2,
        onclick: () => switchPlatform('webgl2'),
      })
      ui.button('FS', {
        flex: 'none',
        onclick: toggleFullscreen,
      })
      if (showCapture.value) {
        ui.button('CA', {
          flex: 'none',
          onclick: captureCanvas,
        })
      }
    })
  })
})

// in production builds vitepress keeps the page mounted when only the query changes,
// so examples reading the query must be restarted explicitly
watch(locationSearch, (search) => {
  if (isMounted && loadedSearch !== null && search !== loadedSearch) {
    loadExample(activePlatform)
  }
})

onUnmounted(() => {
  isMounted = false
  unloadExample()
})

function switchPlatform(platform: PlatformId) {
  if (platform === activePlatform) {
    return
  }
  activePlatform = platform
  loadExample(platform)
}

function createCanvas() {
  // a canvas is bound to a single context type, so each platform needs a fresh one
  const result = document.createElement('canvas')
  result.style.width = '100%'
  result.style.height = '100%'
  result.style.zIndex = '1'
  result.classList.add('loading')
  frame.value!.prepend(result)
  return result
}

async function loadExample(platform: PlatformId) {
  unloadExample()
  const id = ++loadId
  loadedSearch = location.search
  message.value = null
  if (!isSupported(platform)) {
    message.value = {
      title: `${platformNames[platform]} is not supported by your browser or device.`,
      detail:
        requestedPlatform === 'auto'
          ? 'This example could not find a supported graphics platform.'
          : `This example requires ${platformNames[platform]}.`,
    }
    return
  }
  canvas = createCanvas()
  const target = canvas
  const showError = (e: unknown) => {
    console.error(e)
    if (id === loadId) {
      canvas?.remove()
      message.value = {
        title: `The example failed to start with ${platformNames[platform]}.`,
        detail: e instanceof Error ? e.message : String(e ?? ''),
      }
    }
  }
  try {
    const module: any = await getExample().load()
    if (isMounted && id === loadId) {
      toDispose = module.default(canvas, tools.value, platform) || null
      // examples set up asynchronously, a rejection would otherwise leave a blank canvas
      Promise.resolve(toDispose)
        .then(() => {
          // give the example a couple of frames to draw before fading in
          requestAnimationFrame(() => requestAnimationFrame(() => target.classList.remove('loading')))
        })
        .catch(showError)
    }
  } catch (e) {
    showError(e)
  }
}

// keep in sync with the canvas opacity transition
const FADE_DURATION = 300

function unloadExample() {
  const oldCanvas = canvas
  const dispose = toDispose
  canvas = null
  toDispose = null
  if (tools.value) {
    unmountUi(tools.value)
  }
  oldCanvas?.classList.add('leaving')
  // let the canvas fade out before tearing down the example
  const fadeOut = new Promise((resolve) => setTimeout(resolve, oldCanvas ? FADE_DURATION : 0))
  fadeOut
    .then(() => dispose)
    .then((fn) => fn?.())
    .catch(() => {}) // already reported by loadExample
    .finally(() => oldCanvas?.remove())
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
    canvas!.toBlob(resolve, 'image/png')
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

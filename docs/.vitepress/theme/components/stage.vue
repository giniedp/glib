<template>
  <div style="width: 100%; aspect-ratio: 16/9; position: relative" ref="frame">
    <canvas ref="canvas" style="width: 100%; height: 100%; z-index: 1;"></canvas>
    <div style="position: absolute; top: 0; right: 0; max-height: 100%; overflow: auto; z-index: 1; ">
      <button @click="toggleFullscreen">
        Fullscreen
      </button>
      <div ref="tools">

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
export type RunFn = (canvas: HTMLCanvasElement, tools: HTMLElement) => RunDisposeFn
export type RunDisposeFn = () => void

const frame = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const tools = ref<HTMLElement | null>(null)
const props = defineProps({
  run: null as any,
  script: null as any
})
let toDispose: RunDisposeFn | null = null
let isMounted = false
onMounted(async () => {
  isMounted = true
  if (props.script) {
    loadScript(props.script, frame.value!).then((run) => {
      if (!isMounted) {
        return
      }
      toDispose = run(canvas.value, tools.value) || null
    }).catch((e) => {
      console.error(e)
    })
  }
  if (props.run) {
    toDispose = props.run(canvas.value, tools.value) || null
  }
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
async function loadScript(script: string, host: HTMLElement) {
  return import(location.origin + location.pathname + script).then((module) => {
    return module.default
  }).catch((e) => {
    console.error(e)
    return null
  })
}
</script>

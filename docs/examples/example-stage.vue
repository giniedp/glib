<template>
  <div style="width: 100%; aspect-ratio: 16/9; position: relative">
    <canvas ref="canvas" style="width: 100%; height: 100%"></canvas>
    <button style="position: absolute; top: 1rem; right: 1rem" @click="toggleFullscreen">
      Fullscreen
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
export type ExampleFn = (canvas?: HTMLCanvasElement) => ExampleDisposeFn
export type ExampleDisposeFn = () => void

const canvas = ref<HTMLCanvasElement | null>(null)
const props = defineProps({
  example: null as any,
})
let toDispose: ExampleDisposeFn | null = null
onMounted(() => {
  if (canvas.value) {
    toDispose = props.example(canvas.value as any) || null
  }
})

onUnmounted(() => {
  if (toDispose) {
    toDispose()
    toDispose = null
  }
})
function toggleFullscreen() {
  const elem = canvas.value
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

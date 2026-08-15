<template>
  <canvas ref="canvas" style="width: 100%; height: 100%; z-index: 1"></canvas>
</template>

<style>
canvas {
  background-color: transparent;
}
</style>
<script setup lang="ts">
/// <reference types="vite/client" />
import { onMounted, onUnmounted, ref } from 'vue'
const canvas = ref<HTMLCanvasElement | null>(null)
import scene from './hero-scene'

export type RunFn = (canvas: HTMLCanvasElement, tools: HTMLElement) => RunDisposeFn
export type RunDisposeFn = () => void

let dispose: () => void = null!
onMounted(async () => {
  dispose = await scene(canvas.value!)
})

onUnmounted(() => {
  dispose()
})
</script>

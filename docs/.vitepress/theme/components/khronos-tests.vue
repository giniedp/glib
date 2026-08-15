<template>
  <div class="khronos-tests">
    <details v-for="folder in manifest" :key="folder.id">
      <summary style="cursor: pointer">
        <span>{{ humanize(folder.folder) }}</span>
      </summary>
      <div
        v-for="(model, modelId) in folder.models"
        :key="model.fileName"
        style="display: flex; flex-direction: row; align-items: start; margin: 0.5rem 0"
      >
        <img
          v-if="model.sampleImageName"
          :src="imageUrl(folder, model)"
          :alt="model.fileName"
          width="70"
          height="70"
          loading="lazy"
        />
        <div style="display: flex; flex-direction: column">
          <a v-if="model.loadable" :href="modelUrl(folder, modelId)">open test</a>
          <a :href="githubUrl(folder)" target="_blank" rel="noreferrer">open on github</a>
        </div>
      </div>
    </details>
  </div>
</template>

<style>
.khronos-tests {
  summary {
    font-weight: bold;
  }
  h3,
  a {
    color: var(--vp-c-text-2);
    flex-grow: 1;
    padding: 4px 0;
    line-height: 24px;
    font-size: 14px;
    transition: color 0.25s;
  }
  img {
    width: 70px;
    height: 70px;
    object-fit: cover;
    margin-right: 0.5rem;
    border-radius: 0.25rem;
    color: var(--vp-c-text-1);
  }
  a {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    line-height: 1;
  }
  h3:hover,
  a:hover {
    color: var(--vp-c-brand-1);
  }
}
</style>
<script setup lang="ts">
/// <reference types="vite/client" />
import { onMounted, onUnmounted, ref } from 'vue'
type Manifest = ManifestFolder[]
type ManifestFolder = {
  folder: string
  id: number
  models: ManifestModel[]
}
type ManifestModel = {
  fileName: string
  loadable: boolean
  sampleImageName: string
  camera: {
    translation: [number, number, number]
  }
}

const BASE_URL = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Asset-Generator/Output/Positive'
const GITHUB_URL = 'https://github.com/KhronosGroup/glTF-Asset-Generator/tree/master/Output/Positive'
const MANIFEST = `${BASE_URL}/Manifest.json`

const manifest = ref<Manifest>([])

function humanize(name: string) {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

function imageUrl(folder: ManifestFolder, model: ManifestModel) {
  return `${BASE_URL}/${folder.folder}/${model.sampleImageName}`
}

function githubUrl(folder: ManifestFolder) {
  return `${GITHUB_URL}/${folder.folder}`
}

function modelUrl(folder: ManifestFolder, modelId: number) {
  const route = new URL(location.href)
  route.searchParams.set('model', `${folder.id}-${modelId}`)
  return route.toString()
}

onMounted(async () => {
  fetch(MANIFEST)
    .then((res) => res.json())
    .then((result: Manifest) => {
      manifest.value = result.sort((a, b) => a.id - b.id)
    })
})

onUnmounted(() => {
  //
})
</script>

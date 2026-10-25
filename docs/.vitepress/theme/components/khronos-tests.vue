<template>
  <div class="khronos-tests">
    <details v-for="folder in manifest" :key="folder.id" :open="isActiveFolder(folder)">
      <summary :title="folder.folder">
        <span class="label">{{ humanize(folder.folder) }}</span>
        <span class="count">{{ folder.models.length }}</span>
      </summary>
      <div class="entries">
        <div
          v-for="(model, modelId) in folder.models"
          :key="model.fileName"
          class="entry"
          :class="{ active: isActive(folder, modelId), disabled: !model.loadable }"
          :title="model.fileName"
        >
          <img
            v-if="model.sampleImageName"
            :src="imageUrl(folder, model)"
            :alt="model.fileName"
            width="56"
            height="56"
            loading="lazy"
          />
          <div class="info">
            <a v-if="model.loadable" class="name" :href="modelUrl(folder, modelId)">{{ modelLabel(model) }}</a>
            <span v-else class="name">{{ modelLabel(model) }}</span>
            <span v-if="!model.loadable" class="note">not loadable</span>
            <a class="link" :href="githubUrl(folder)" target="_blank" rel="noreferrer">github</a>
          </div>
        </div>
      </div>
    </details>
  </div>
</template>

<style>
.khronos-tests {
  margin-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 0.5rem;

  details {
    border-bottom: 1px solid var(--vp-c-divider);
  }

  summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 6px 0;
    cursor: pointer;
    list-style: none;
    font-size: 14px;
    font-weight: 600;
    line-height: 24px;
    color: var(--vp-c-text-1);
    transition: color 0.25s;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::before {
    content: '';
    flex: none;
    width: 6px;
    height: 6px;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: rotate(-45deg);
    transition: transform 0.25s;
    opacity: 0.6;
  }
  details[open] > summary::before {
    transform: rotate(45deg);
  }
  summary:hover {
    color: var(--vp-c-brand-1);
  }
  summary .label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  summary .count {
    flex: none;
    padding: 0 6px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
    line-height: 18px;
    color: var(--vp-c-text-2);
    background: var(--vp-c-default-soft);
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 0 0.5rem 0;
  }

  .entry {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 4px;
    border: 1px solid transparent;
    border-radius: 6px;
    transition:
      background-color 0.25s,
      border-color 0.25s;
  }
  .entry:hover {
    background: var(--vp-c-default-soft);
  }
  .entry.active {
    border-color: var(--vp-c-brand-1);
    background: var(--vp-c-brand-soft);
  }
  .entry.disabled {
    opacity: 0.5;
  }

  img {
    flex: none;
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 4px;
    background: var(--vp-c-bg-soft);
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .name,
  .link,
  .note {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name {
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
    color: var(--vp-c-text-1);
  }
  .link,
  .note {
    font-size: 12px;
    line-height: 16px;
    color: var(--vp-c-text-2);
  }
  a {
    text-decoration: none;
    transition: color 0.25s;
  }
  a:hover,
  .entry.active .name {
    color: var(--vp-c-brand-1);
  }
}
</style>
<script setup lang="ts">
/// <reference types="vite/client" />
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { locationSearch } from '../location-search'
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

const BASE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Asset-Generator/main/Output/Positive'
const GITHUB_URL = 'https://github.com/KhronosGroup/glTF-Asset-Generator/tree/main/Output/Positive'
const MANIFEST = `${BASE_URL}/Manifest.json`

const manifest = ref<Manifest>([])

function humanize(name: string) {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

const activeKey = computed(() => new URLSearchParams(locationSearch.value).get('model'))

function isActive(folder: ManifestFolder, modelId: number) {
  return activeKey.value === `${folder.id}-${modelId}`
}

function isActiveFolder(folder: ManifestFolder) {
  return !!activeKey.value?.startsWith(`${folder.id}-`)
}

function modelLabel(model: ManifestModel) {
  const name = model.fileName.replace(/\.(gltf|glb)$/i, '')
  const index = name.match(/_(\d+)$/)?.[1]
  return index ? `Model ${index}` : humanize(name)
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

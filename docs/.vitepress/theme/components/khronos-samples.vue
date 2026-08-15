<template>
  <div class="khronos-samples">
    <div v-for="mdl in index" :key="mdl.name" style="margin: 1rem 0">
      <h3 :title="mdl.name">
        <b>{{ humanize(mdl.name) }}</b>
      </h3>
      <div style="display: flex; flex-direction: row; align-items: start">
        <img v-if="mdl.screenshot" :src="imageUrl(mdl)" :alt="mdl.name" loading="lazy" width="70" height="70" />
        <div style="display: flex; flex-direction: column">
          <a v-for="(_, variant) in mdl.variants" :key="variant" :href="variantUrl(mdl, variant)">
            {{ variant }}
          </a>
          <a :href="githubUrl(mdl)" target="_blank" rel="noreferrer"> open on github </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.khronos-samples {
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
type GltfIndex = GltfIndexModel[]
type GltfIndexModel = {
  name: string
  screenshot: string
  variants: {
    [key: string]: string
  }
}

const BASE_URL = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets/Models'
const GITHUB_URL = 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/master/Models'
const INDEX_FILE = `${BASE_URL}/model-index.json`

const index = ref<GltfIndex>([])

function humanize(name: string) {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

function imageUrl(model: GltfIndexModel) {
  return `${BASE_URL}/${model.name}/${model.screenshot}`
}

function githubUrl(model: GltfIndexModel) {
  return `${GITHUB_URL}/${model.name}`
}

function variantUrl(model: GltfIndexModel, variant: string) {
  const route = new URL(location.href)
  route.searchParams.set('model', `${model.name}_${variant}`)
  return route.toString()
}

onMounted(async () => {
  fetch(INDEX_FILE)
    .then((res) => res.json())
    .then((result: GltfIndex) => {
      index.value = result
    })
})

onUnmounted(() => {
  //
})
</script>

<template>
  <div class="khronos-samples">
    <div
      v-for="mdl in index"
      :key="mdl.name"
      class="entry"
      :class="{ active: isActiveModel(mdl) }"
      :title="mdl.name"
    >
      <img v-if="mdl.screenshot" :src="imageUrl(mdl)" :alt="mdl.name" loading="lazy" width="56" height="56" />
      <div class="info">
        <span class="name">{{ humanize(mdl.name) }}</span>
        <div class="variants">
          <a
            v-for="(_, variant) in mdl.variants"
            :key="variant"
            class="variant"
            :class="{ active: isActive(mdl, variant) }"
            :href="variantUrl(mdl, variant)"
          >
            {{ variant }}
          </a>
        </div>
        <a class="link" :href="githubUrl(mdl)" target="_blank" rel="noreferrer">github</a>
      </div>
    </div>
  </div>
</template>

<style>
.khronos-samples {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 0.5rem;

  .entry {
    display: flex;
    align-items: flex-start;
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
    gap: 4px;
    min-width: 0;
  }
  .name,
  .link {
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
  .entry.active .name {
    color: var(--vp-c-brand-1);
  }

  .variants {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .variant {
    padding: 0 6px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
    line-height: 18px;
    color: var(--vp-c-text-2);
    background: var(--vp-c-default-soft);
  }
  .variant.active {
    color: var(--vp-c-white);
    background: var(--vp-c-brand-1);
  }

  .link {
    font-size: 12px;
    line-height: 16px;
    color: var(--vp-c-text-2);
  }
  a {
    text-decoration: none;
    transition:
      color 0.25s,
      background-color 0.25s;
  }
  a:hover {
    color: var(--vp-c-brand-1);
  }
  .variant.active:hover {
    color: var(--vp-c-white);
    background: var(--vp-c-brand-2);
  }
}
</style>
<script setup lang="ts">
/// <reference types="vite/client" />
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { locationSearch } from '../location-search'
type GltfIndex = GltfIndexModel[]
type GltfIndexModel = {
  name: string
  screenshot: string
  variants: {
    [key: string]: string
  }
}

const BASE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models'
const GITHUB_URL = 'https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models'
const INDEX_FILE = `${BASE_URL}/model-index.json`

const index = ref<GltfIndex>([])

const activeKey = computed(() => new URLSearchParams(locationSearch.value).get('model'))

function isActive(model: GltfIndexModel, variant: string) {
  return activeKey.value === `${model.name}_${variant}`
}

function isActiveModel(model: GltfIndexModel) {
  return Object.keys(model.variants).some((variant) => isActive(model, variant))
}

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

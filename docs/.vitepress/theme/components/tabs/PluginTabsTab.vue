<template>
  <div
    :id="`panel-${label}-${tabs.uid}`"
    class="plugin-tabs--content"
    :class="{ 'is-active': tabs.selected.value === label }"
    role="tabpanel"
    tabindex="0"
    :aria-labelledby="`tab-${label}-${tabs.uid}`"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { tabsKey } from './key'

defineProps<{
  label: string
}>()

const tabs = inject(tabsKey)!
</script>

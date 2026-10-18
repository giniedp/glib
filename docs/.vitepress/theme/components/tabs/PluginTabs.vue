<template>
  <div class="plugin-tabs" :data-variant="variant">
    <div ref="tablist" class="plugin-tabs--tab-list" role="tablist" @keydown="onKeydown">
      <button
        v-for="(label, index) in labels"
        :id="`tab-${label}-${uid}`"
        :key="label"
        ref="buttons"
        role="tab"
        class="plugin-tabs--tab"
        :aria-selected="label === selected"
        :aria-controls="`panel-${label}-${uid}`"
        :tabindex="label === selected ? 0 : -1"
        @click="select(index)"
      >
        {{ label }}
      </button>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
// Replaces the client side of vitepress-plugin-tabs (its markdown plugin emits <PluginTabs> / <PluginTabsTab>).
// All panels are rendered, inactive ones are hidden by a stylesheet class, so the content of every tab
// is part of the static html (readable without javascript, e.g. by crawlers and LLM tools).
import { computed, nextTick, provide, ref, useId, useSlots, type VNode } from 'vue'
import { tabsKey } from './key'

defineProps<{
  variant?: string
  sharedStateKey?: string
}>()

const slots = useSlots()
const labels = computed(() => {
  return (slots.default?.() ?? []).filter(isTab).map((vnode) => String(vnode.props!.label))
})

const uid = useId()
const selectedLabel = ref<string>()
const selected = computed(() => {
  const label = selectedLabel.value
  return label && labels.value.includes(label) ? label : labels.value[0]
})
provide(tabsKey, { uid, selected })

const tablist = ref<HTMLElement>()
const buttons = ref<HTMLButtonElement[]>([])

async function select(index: number) {
  // keep the tab list at the same viewport position when the panel height changes
  const el = tablist.value
  const offset = el ? el.getBoundingClientRect().top : 0
  selectedLabel.value = labels.value[index]
  await nextTick()
  if (el) {
    window.scrollBy(0, el.getBoundingClientRect().top - offset)
  }
}

function onKeydown(e: KeyboardEvent) {
  const count = labels.value.length
  const current = labels.value.indexOf(selected.value)
  let index: number
  if (e.key === 'ArrowLeft') {
    index = (current - 1 + count) % count
  } else if (e.key === 'ArrowRight') {
    index = (current + 1) % count
  } else {
    return
  }
  select(index)
  buttons.value[index]?.focus()
}

function isTab(vnode: VNode) {
  return typeof vnode.type === 'object' && (vnode.type as any).__name === 'PluginTabsTab' && !!vnode.props
}
</script>

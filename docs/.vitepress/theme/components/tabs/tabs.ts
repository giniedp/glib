import type { App } from 'vue'
import PluginTabs from './PluginTabs.vue'
import PluginTabsTab from './PluginTabsTab.vue'
import './tabs.css'

export function enhanceAppWithTabs(app: App) {
  app.component('PluginTabs', PluginTabs)
  app.component('PluginTabsTab', PluginTabsTab)
}

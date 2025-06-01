// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import 'tweak-ui/dist/tweak-ui.css'
import Example from './components/example.vue'
import ExampleCode from './components/example-code.vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    app.component('Example', Example)
    app.component('ExampleCode', ExampleCode)
  }
} satisfies Theme

// https://vitepress.dev/guide/custom-theme
import 'tweak-ui/style.css'
import { useData, type Theme } from 'vitepress'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import ExampleCode from './components/example-code.vue'
import Example from './components/example.vue'
import HeroImage from './components/hero-image.vue'
import KhronosSamples from './components/khronos-samples.vue'
import KhronosTests from './components/khronos-tests.vue'
import './style.css'

const asideComponents: Record<string, any> = {
  KhronosTests,
  KhronosSamples,
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => h(HeroImage),
      'aside-outline-after': () => {
        const { frontmatter } = useData()
        const componentName = frontmatter.value.asideComponent
        const AsideComponent = asideComponents[componentName]
        if (AsideComponent) {
          return h(AsideComponent)
        }
      },
    })
  },
  enhanceApp({ app, router, siteData }) {
    app.component('Example', Example)
    app.component('ExampleCode', ExampleCode)
    enhanceAppWithTabs(app)
  },
} satisfies Theme

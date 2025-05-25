import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import { fileURLToPath } from 'node:url'
// https://vitepress.dev/reference/site-config

export default defineConfig({
  title: 'GGlib',
  description: 'A VitePress Site',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
    ],

    // https://vitepress-sidebar.cdget.com/guide/getting-started
    sidebar: generateSidebar({
      documentRootPath: '/docs',
      useTitleFromFileHeading: true,
      collapsed: true,
      collapseDepth: 2,
      debugPrint: false,

      // includeRootIndexFile: true,
      // includeFolderIndexFile: true,
      includeEmptyFolder: false,
      useFolderLinkFromIndexFile: true,
      useFolderTitleFromIndexFile: true,
      useTitleFromFrontmatter: true,
      frontmatterTitleFieldName: 'title',
      excludePattern: [],
    }),

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
  },
  vite: {

    resolve: {
      alias: {
        '@components': fileURLToPath(new URL('./theme/components', import.meta.url)),
      },
    },
  },
})

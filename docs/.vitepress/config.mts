import { defineConfig } from 'vitepress'
import { generateSidebar } from 'vitepress-sidebar'
import { fileURLToPath } from 'node:url'
// https://vitepress.dev/reference/site-config

export default defineConfig({
  title: 'GGlib',
  description: 'Game and Graphics Library',

  themeConfig: {
    logo: '/logo/gglib.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/examples' },
    ],

    // https://vitepress-sidebar.cdget.com/guide/getting-started
    sidebar: generateSidebar({
      documentRootPath: '/docs',
      useTitleFromFileHeading: true,
      collapsed: true,
      collapseDepth: 2,
      debugPrint: false,
      sortMenusByFrontmatterOrder: true,
      frontmatterOrderDefaultValue: 1000,


      // includeRootIndexFile: true,
      // includeFolderIndexFile: true,
      includeEmptyFolder: false,
      useFolderLinkFromIndexFile: true,
      useFolderTitleFromIndexFile: true,
      useTitleFromFrontmatter: true,
      frontmatterTitleFieldName: 'title',
      excludePattern: [],
    }),

    socialLinks: [{ icon: 'github', link: 'https://github.com/giniedp/glib' }],
  },
  vite: {
    publicDir: '../assets',
    resolve: {
      alias: {
        '@components': fileURLToPath(new URL('./theme/components', import.meta.url)),
      },
    },
  },
})

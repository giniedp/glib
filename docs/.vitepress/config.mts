import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { withSidebar } from 'vitepress-sidebar'

// https://vitepress.dev/reference/site-config
export default withSidebar(
  {
    head: [['link', { rel: 'icon', href: '/logo/gglib.svg' }]],
    title: 'GGlib',
    description: 'Game and Graphics Library',
    themeConfig: {
      logo: '/logo/gglib.svg',
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Examples', link: '/examples/' },
      ],
      footer: {
        message: 'Released under the MIT License.',
        copyright: '',
      },
      // https://vitepress-sidebar.cdget.com/guide/getting-started

      socialLinks: [{ icon: 'github', link: 'https://github.com/giniedp/glib' }],
    },
    markdown: {
      config(md) {
        md.use(tabsMarkdownPlugin)
      },
    },
    vite: {
      publicDir: '../assets',
      resolve: {
        alias: {
          '@components': fileURLToPath(new URL('./theme/components', import.meta.url)),
        },
      },
      plugins: [
        {
          name: 'thumbnail-capture',
          configureServer(server) {
            server.middlewares.use('/__capture', (req, res) => {
              if (req.method !== 'POST') {
                res.statusCode = 405
                return res.end()
              }
              const filePath = new URL(req.url!, 'http://x').searchParams.get('file')!

              const chunks: Buffer[] = []
              req.on('data', (c) => chunks.push(c))
              req.on('end', () => {
                const file = path.join('docs', filePath.replace(/^\//, ''))
                // fs.mkdirSync(path.dirname(file), { recursive: true })
                fs.writeFileSync(file, Buffer.concat(chunks))
                console.log('✓ thumbnail saved:', file)
                res.end('ok')
              })
            })
          },
        },
      ],
    },
  },
  {
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
  },
)

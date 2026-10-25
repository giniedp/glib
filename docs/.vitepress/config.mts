import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import llmstxt from 'vitepress-plugin-llms'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { withSidebar } from 'vitepress-sidebar'
import { exampleCodePlugin } from './example-code-plugin'

// https://vitepress.dev/reference/site-config
export default withSidebar(
  {
    head: [['link', { rel: 'icon', href: '/logo/gglib.svg' }]],
    title: 'GGlib',
    description: 'Game and Graphics Libraries',
    themeConfig: {
      logo: '/logo/gglib.svg',
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Docs', link: '/about/gglib' },
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
      toc: {},
    },
    vite: {
      publicDir: '../assets',
      resolve: {
        alias: {
          '@components': fileURLToPath(new URL('./theme/components', import.meta.url)),
        },
      },
      plugins: [
        // must run before llmstxt, which collects the markdown as transformed by exampleCodePlugin
        exampleCodePlugin() as any,
        llmstxt({
          title: 'GGlib',
          description: 'WebGPU-first libraries for game and graphics development.',
          details: [
            'GGlib is a collection of TypeScript packages for real-time 3D web applications.',
            '',
            '- Essentials: `@gglib/utils` (game loop, events), `@gglib/math` (algebra), `@gglib/graphics` (WebGPU and WebGL2 abstraction)',
            '- Mid level: `@gglib/game` (game loop, input), `@gglib/content` + `@gglib/loaders` (content pipeline, .gltf/.dds/.ktx/...), `@gglib/effects` (shaders, post-processing), `@gglib/model` (models, animation)',
            '- High level: `@gglib/render` (renderer, frame graph), `@gglib/ecs` + `@gglib/components` (entity component system)',
            '',
            'Most pages are runnable examples, their full source code is included as `ts` code blocks.',
          ].join('\n'),
        }),
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
    useFolderLinkFromIndexFile: false,
    useFolderTitleFromIndexFile: true,
    useTitleFromFrontmatter: true,
    frontmatterTitleFieldName: 'title',
    excludePattern: [],
  },
)

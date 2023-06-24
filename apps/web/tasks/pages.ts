import * as path from 'path'

import Metalsmith from 'metalsmith'

import msSass from './utils/ms-sass'
import filter from 'metalsmith-filter'
import msMetadata from './utils/ms-metadata'
import msPug from './utils/ms-pug'
import msTypescript from './utils/ms-typescript'
import msBrowserSync from './utils/ms-browsersync'
import msMarkdown, { highlight } from './utils/ms-markdown'
import msWatch from './utils/ms-watch'
import msRelayout from './utils/ms-relayout'
import config from '../config'

require('jstransformer')(require('jstransformer-markdown-it'))

async function run() {
  Metalsmith(config.cwd)
    .metadata({
      //
    })
    .frontmatter(true)
    .clean(false)
    .source(config.src)
    .destination(config.dist)
    .use(filter(['**/*', '!**/_*/**/*', '!**/_*.*']))
    .use(msMetadata())
    .use(
      msSass({
        includePaths: [path.join(process.cwd(), 'node_modules')],
      }),
    )
    .use([
      msMarkdown({
        match: 'docs/api/*',
        options: {
          html: true,
          linkify: true,
        }
      }),
      msRelayout({
        match: 'docs/api/*',
        template: '_layouts/_api.pug',
      }),
    ])
    .use(
      msPug({
        compileOptions: {
          filters: {
            highlight: highlight,
          },
        },
        locals: (file) => {
          return {
            project: config,
            assetPath: (asset: string) => {
              return asset
            },
            metadata: (data: any) => {
              return {
                title: data.title,
                description: data.description,
                href: data.href,
                frontpage: data.frontpage,
                sandbox: data.sandbox,
                skipPreview: data.skipPreview,
                files: data.files,
              }
            },
          }
        },
      }),
    )
    .use(
      msTypescript({
        keepOriginal: true,
      }),
    )
    .use(
      msBrowserSync({
        name: 'glib',
        config: {
          server: config.dist,
          open: false,
          reloadDebounce: 2000,
          // Workaround for https://github.com/BrowserSync/browser-sync/issues/1600
          snippetOptions: {
            rule: {
              match: /<\/head>/u,
              fn(snippet, match) {
                const src = /src='(?<src>[^']+)'/u.exec(snippet).groups.src
                return `<script src="${src}" async></script>${match}`
              },
            },
          },
        },
      }),
    )
    .use(
      msWatch({
        pattern: '**/*',
      }),
    )
    .build((err) => {
      if (err) {
        console.error(err)
      }
    })
}

export async function pages() {
  return run()
}

export async function pagesWatch() {
  process.env.METALSMITH_WATCH = 'yes'
  return run()
}

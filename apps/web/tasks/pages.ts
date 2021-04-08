import * as path from 'path'

import Metalsmith from 'metalsmith'

import msSass from 'metalsmith-sass'
import filter from 'metalsmith-filter'
import msMetadata from './utils/ms-metadata'
import msPug from './utils/ms-pug'
import msTypescript from './utils/ms-typescript'
import msBrowserSync from './utils/ms-browsersync'
import msMarkdown, { highlight } from './utils/ms-markdown'
import msWatch from './utils/ms-watch'
import msRelayout from './utils/ms-relayout'
import manifest from '../manifest'

require('jstransformer')(require('jstransformer-markdown-it'))

async function run() {
  Metalsmith(manifest.cwd)
    .metadata({
      //
    })
    .frontmatter(true)
    .clean(false)
    .source(manifest.src)
    .destination(manifest.dist)
    .use(filter(['**/*', '!**/_*/**/*', '!**/_*.*']))
    .use(msMetadata())
    .use(
      msSass({
        includePaths: ['node_modules'],
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
            project: manifest,
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
          server: manifest.dist,
          open: false
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

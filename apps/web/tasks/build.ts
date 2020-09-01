import { dest, src, parallel } from 'gulp'
import gulpSass from 'gulp-sass'
import * as path from 'path'
import { pugPages, PugPageMeta } from '@tools/utils'
import manifest from '../manifest'
import { gulpTranspileTs } from './utils'
import minimatch from 'minimatch'

export function assets() {
  return src(manifest.assets, { cwd: manifest.cwd, allowEmpty: true }).pipe(dest(path.join(manifest.dist, 'assets')))
}

export function scss() {
  return src(manifest.styles, { cwd: manifest.cwd })
    .pipe(
      gulpSass({
        includePaths: ['node_modules'],
      }).on('error', (e: Error) => {
        console.error(e)
      }),
    )
    .pipe(dest(manifest.dist))
}

export function scripts() {
  return src(manifest.scripts, { cwd: manifest.cwd })
    .pipe(gulpTranspileTs())
    .pipe(dest(manifest.dist))
}

export function pages() {
  return src(manifest.pages, { cwd: manifest.cwd })
    .pipe(
      pugPages({
        cwd: manifest.cwd,
        augmentMetadata: (meta: PugPageMeta): PugPageMeta => {
          if (minimatch(meta.original, path.join(manifest.src, 'docs', 'api', '*.md'))) {
            meta.template = path.join(manifest.src, '_layouts', '_api.pug')
          }
          return meta
        },
        compileOptions: {
          pretty: true,
          basedir: manifest.src,
          locals: (file: string) => {
            return {
              project: manifest,
              assetPath: (asset: string) => {
                if (!path.isAbsolute(asset)) {
                  return asset
                }
                return path.relative(
                  path.dirname(file.replace(manifest.cwd, manifest.dist)),
                  path.join(manifest.dist, asset),
                )
              },
            }
          },
        },
      }),
    )
    .pipe(dest(manifest.dist))
}

export const build = parallel(assets, scss, scripts, pages)

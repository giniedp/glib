import { dest, src, series } from 'gulp'
import * as gulpSass from 'gulp-sass'
import * as path from 'path'
import { transform, pugPages, pugPageTS } from '@tools/utils'
import manifest from "../manifest"

export function  assets() {
  return src(manifest.assets, { cwd: manifest.cwd })
    .pipe(dest(path.join(manifest.dist, "assets")))
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

export function pages() {
  return src(manifest.pages, { cwd: manifest.cwd })
    .pipe(pugPageTS())
    .pipe(
      pugPages({
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

export const build = series(scss, pages, assets)

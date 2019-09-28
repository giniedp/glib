import { dest, series, src, watch } from 'gulp'
import * as connect from 'gulp-connect'
import * as gulpSass from 'gulp-sass'
import * as path from 'path'

import * as browserSync from 'browser-sync'
import project from '../project'
import { buildPackages } from './build'
import pugPages from './plugins/pug-pages'
import transpileExample from './plugins/transpile-example'

function assets() {
  return src(project.page.assets, { allowEmpty: true }).pipe(
    dest(path.join(project.dist, 'assets')),
  )
}

function scss() {
  return src(project.page.scss)
    .pipe(
      gulpSass({
        includePaths: ['node_modules'],
      }).on('error', (e: Error) => {
        console.error(e)
      }),
    )
    .pipe(dest(project.dist))
}

function pages() {
  return src(project.page.pages)
    .pipe(transpileExample())
    .pipe(
      pugPages({
        compileOptions: {
          pretty: true,
          basedir: project.pageSrc,
          locals: (file: string) => {
            return {
              project: project,
              assetPath: (asset: string) => {
                if (!path.isAbsolute(asset)) {
                  return asset
                }
                return path.relative(
                  path.dirname(file.replace(project.pageSrc, project.dist)),
                  path.join(project.dist, asset),
                )
              },
            }
          },
        },
      }),
    )
    .pipe(dest(project.dist))
}

export function serve() {
  browserSync.init({
    server: project.dist,
  })
  watch(path.join(project.dist, '**', '*'), { delay: 500 }).on(
    'change',
    browserSync.reload,
  )
}

const packages = series(buildPackages, assets)

export const page = series(scss, pages, assets)

export function watchPage(end) {
  const watchScss = watch(
    project.page.scss.filter((it) => it[0] !== '!'),
    { delay: 500 },
    scss,
  )
  const watchPages = watch(project.page.pages, { delay: 500 }, pages)
  const watchAssets = watch(
    project.page.assets.filter((it) => it.startsWith('assets')),
    { delay: 500 },
    assets,
  )
  const watchPackages = watch(project.pkgSrc, { delay: 500 }, packages)

  watchScss.emit('change')
  watchPages.emit('change')
  watchAssets.emit('change')
  watchPackages.emit('change')

  process.on('SIGINT', () => {
    watchScss.close()
    watchPages.close()
    watchAssets.close()
    watchPackages.close()
    end()
    connect.serverClose()
    process.exit(1)
  })
}

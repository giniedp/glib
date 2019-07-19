import * as fs from 'fs'
import { dest, parallel, series, src, task, watch } from 'gulp'
import * as connect from 'gulp-connect'
import * as gulpSass from 'gulp-sass'
import * as path from 'path'
import { Transform } from 'stream'

import vinyl = require('vinyl')
import project from '../project'
import * as pugPages from '../pug-pages'
import transpileExample from './plugins/transpile-example'

function assets() {
  return src(project.page.assets, { allowEmpty: true })
    .pipe(dest(path.join(project.dist, 'assets')))
    .pipe(connect.reload())
}

function scss() {
  return src(project.page.scss)
  .pipe(gulpSass({
    includePaths: ['node_modules'],
  }).on('error', (e: Error) => {
    console.error(e)
  }))
  .pipe(dest(project.dist))
  .pipe(connect.reload())
}

function pages() {
  return src(project.page.pages)
    .pipe(new Transform({
      objectMode: true,
      transform: function(file: any, encoding, cb) {
        if (path.extname(file.path) === '.ts') {
          this.push(new vinyl({
            cwd: file.cwd,
            base: file.base,
            path: path.join(path.dirname(file.path), path.basename(file.path, '.ts')) + '.js',
            contents: Buffer.from(transpileExample(file.path)),
          }))
        }
        cb(null, file)
      },
      flush: (cb) => cb(null, null),
    }))
    .pipe(pugPages.transform({
      compileOptions: {
        pretty: true,
        basedir: project.pageSrc,
        locals: (file: string) => {
          return {
            project: project,
          }
        },
      },
    }))
    .pipe(dest(project.dist))
    .pipe(connect.reload())
}

export function serve() {
  connect.server({
    name: 'Glib Examples',
    root: project.dist,
    host: '0.0.0.0',
    port: 3000,
    livereload: true,
    debug: true,
  })
}

export function watchPage(end) {
  const watchScss = watch(project.page.scss.filter((it) => it[0] !== '!'), { delay: 500 }, scss)
  const watchPages = watch(project.page.pages, { delay: 500 }, pages)
  const watchAssets = watch(project.page.assets, { delay: 500 }, assets)

  watchScss.emit('change')
  watchPages.emit('change')
  watchAssets.emit('change')

  process.on('SIGINT', () => {
    watchScss.close()
    watchPages.close()
    watchAssets.close()
    end()
    connect.serverClose()
    process.exit(1)
  })
}

import * as fs from 'fs'
import { dest, parallel, series, src, task, watch } from 'gulp'
import * as livereload from 'gulp-livereload'
import * as webserver from 'gulp-webserver'
import * as path from 'path'
import { Transform } from 'stream'

import vinyl = require('vinyl')
import project from '../project'
import * as pugPages from '../pug-pages'
import transpileExample from './plugins/transpile-example'

export function examples() {
  return src([
    path.join(project.sampleSrc, '**/*'),
    '!**/_*',
    '!**/tsconfig.json',
  ])
    .pipe(new Transform({
      objectMode: true,
      transform: function(file: any, encoding, cb) {
        if (path.extname(file.path) === '.ts') {
          this.push(new vinyl({
            cwd: file.cwd,
            base: file.base,
            path: path.join(path.dirname(file.path), path.basename(file.path, '.ts')) + '.js',
            contents: new Buffer(transpileExample(file.path)),
          }))
        }
        cb(null, file)
      },
      flush: (cb) => cb(null, null),
    }))
    .pipe(pugPages.transform({
      compileOptions: {
        pretty: true,
        basedir: project.sampleSrc,
        locals: (file: string) => {
          const fileDir = path.dirname(file)
          const fileName = path.basename(file, '.jade')
          return {
            // transpile: (name: string) => '\n' + transpileGlob(path.join(fileDir, name).replace('${fileName}', fileName)),
            // _: underscore,
          }
        },
      },
    }))
    .pipe(dest(project.sampleDist))
    .pipe(new Transform({
      objectMode: true,
      transform: (file: any, encoding, cb) => {
        fs.symlink(project.pkgDstDir('gglib', 'bundles', 'gglib.umd.js'), path.join(path.dirname(file.path), 'gglib.umd.js'), () => {
          cb(null, null)
        })
      },
      flush: (cb) => cb(),
    }))
}

function reload() {
  return Promise.resolve(livereload.reload())
}

export function serve() {
  return src([project.dist], { allowEmpty: true })
    .pipe(webserver({
      host: '0.0.0.0',
      port: 3000,
      livereload: true,
      directoryListing: false,
      open: false,
    }))
}

export function watchExamples(end) {
  const w = watch(project.sampleSrc, { delay: 500 }, series(examples, reload))
  w.emit('change')

  process.on('SIGINT', () => {
    w.close()
    end()
    process.exit(1)
  })
}

task(serve)
task(watchExamples)
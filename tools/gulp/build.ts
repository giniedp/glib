import { series, task, watch } from 'gulp'
import project from '../project'
import { api, docs } from './api'
import { bundle } from './bundle'
import { clean } from './clean'
import { compile } from './compile'

task('build', series(
  clean,
  compile,
  bundle,
  api,
  docs,
))

export function watchPackages(end) {
  const w = watch(project.pkgSrc, { delay: 500 }, series(compile, bundle))
  w.emit('change')

  process.on('SIGINT', () => {
    w.close()
    end()
    process.exit(1)
  })
}

task(watchPackages)

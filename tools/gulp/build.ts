import { series, watch } from 'gulp'
import project from '../project'
import { bundle } from './bundle'
import { compile } from './compile'

export function watchPackages(end) {
  const w = watch(project.pkgSrc, { delay: 500 }, series(compile, bundle))
  w.emit('change')

  process.on('SIGINT', () => {
    w.close()
    end()
    process.exit(1)
  })
}

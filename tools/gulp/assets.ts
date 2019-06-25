import { dest, series, src, task, watch } from 'gulp'
import * as path from 'path'
import project from '../project'

export function assets() {
  return src([
    path.join(project.root, 'assets', '**/*'),
  ]).pipe(dest(path.join(project.dist, 'assets')))
}

export function watchAssets(end) {
  const w = watch(path.join(project.root, 'assets', '**/*'), { delay: 500 }, series(assets))
  w.emit('change')

  process.on('SIGINT', () => {
    w.close()
    end()
    process.exit(1)
  })
}

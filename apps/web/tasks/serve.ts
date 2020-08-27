import * as path from 'path'
import browserSync from 'browser-sync'

export async function serve() {
  const dist = path.join(__dirname, '..', 'dist')
  browserSync({
    server: dist,
  })
    .watch(path.join(dist, '**', '*'), {})
    .on('change', browserSync.reload)
}

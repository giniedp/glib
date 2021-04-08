import { dest, parallel, src, watch } from 'gulp'
import * as path from 'path'
import manifest from '../manifest'

export function assets() {
  return src(manifest.assets, { cwd: manifest.cwd, allowEmpty: true }).pipe(dest(path.join(manifest.dist, 'assets')))
}

export const assetsWatch = parallel([
  assets,
  async () => {
    return new Promise((resolve) => {
      const w = watch(
        manifest.assets,
        {
          cwd: manifest.cwd,
          delay: 500,
        },
        assets,
      )
      function exit() {
        w.close()
        resolve(void 0)
      }
      process.on('SIGTERM', exit)
      process.on('SIGINT', exit)
    })
  },
])

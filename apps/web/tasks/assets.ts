import { dest, parallel, src, watch } from 'gulp'
import * as path from 'path'
import config from '../config'

export function assets() {
  return src(config.assets, { cwd: config.cwd, allowEmpty: true }).pipe(dest(path.join(config.dist, 'assets')))
}

export const assetsWatch = parallel([
  assets,
  async () => {
    return new Promise((resolve) => {
      const w = watch(
        config.assets,
        {
          cwd: config.cwd,
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

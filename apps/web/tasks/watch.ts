import { watch as gulpWatch, series } from 'gulp'
import manifest from '../manifest'
import { scss, pages, build, assets, scripts } from './build'
import { namedTask } from '@tools/utils'
import { FSWatcher } from 'fs'

export const watch = series(
  build,
  namedTask('watch', async () => {
    return new Promise((resolve) => {
      const watchOptions = {
        cwd: manifest.cwd,
        delay: 500,
      }
      const watched: FSWatcher[] = []
      watched.push(gulpWatch(
        manifest.styles.filter((it) => it[0] !== '!'),
        watchOptions,
        scss,
      ))
      watched.push(gulpWatch(
        manifest.pages.filter((it) => it[0] !== '!'),
        watchOptions,
        pages,
      ))
      watched.push(gulpWatch(
        manifest.assets,
        watchOptions,
        assets,
      ))
      watched.push(gulpWatch(
        manifest.scripts,
        watchOptions,
        scripts,
      ))

      function exit() {
        watched.forEach(it => it.close())
        resolve()
      }
      process.on('SIGTERM', exit)
      process.on('SIGINT', exit)
    })
  }),
)

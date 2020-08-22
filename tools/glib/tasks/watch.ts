import { watch as gulpWatch } from 'gulp'
import { build } from './build'
import context from '../context'

export function watch(end) {
  const w = gulpWatch(
    context.glibPackages.map((it) => it.srcDir()),
    { delay: 500 },
    build,
  )
  w.emit('change')
  function exit() {
    w.close()
    end()
    process.exit(1)
  }
  process.on('SIGINT', exit)
  process.on('SIGTERM', exit)
}

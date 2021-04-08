import Metalsmith from 'metalsmith'
import * as path from 'path'
import chokidar from 'chokidar'
import wplog from 'webpack-log'

const log = wplog({
  name: 'ms-watch',
  timestamp: true,
})

if (process.argv.includes('-w') || process.argv.includes('--watch')) {
  process.env.METALSMITH_WATCH = 'yes'
}

export default (options: { pattern: string | string[] }) =>{
  let isWatching: boolean
  return (files: Metalsmith.Files, smith: Metalsmith, done: Function) => {
    if (!isWatching && process.env.METALSMITH_WATCH) {
      log.info('watching files')
      isWatching = !!watch(options.pattern, smith)
    }
    done(null)
  };
}

function watch(pattern: string | string[], smith: Metalsmith) {
  pattern = (Array.isArray(pattern) ? pattern : [pattern]).map((it) => path.join(smith.source(), it))
  const watcher = chokidar.watch(pattern, {
    ignoreInitial: true
  })
  process.on('SIGTERM', () => watcher.close())
  process.on('SIGINT', () => watcher.close())

  let changes: Record<string, any> = {}
  let time: any
  let mode: 'run' | 'build' = 'run'
  watcher.on('all', (e, file) => {
    if (e === 'add' || e === 'change') {
      file = path.relative(smith.source(), file)
      log.info(e, file)
      changed(file)
    }
  })
  function changed(file: string) {
    if (path.basename(file).startsWith('_')) {
      mode = 'build'
    }
    const read = smith.readFile.bind(smith) as any
    read(file, (err: Error, ret: any) => {
      clearTimeout(time)
      if (err) {
        log.error(err)
      } else {
        changes[file] = ret
      }
      time = setTimeout(commit, 1000)
    })
  }
  function commit() {
    const files = {...changes}
    changes = {}
    const doBuild = mode === 'build'
    mode = 'run'
    if (doBuild) {
      build()
    } else {
      run(files)
    }
  }
  function run(files) {
    log.info('run')
    smith.run(files, (err, res) => {
      if (err) {
        log.error(err)
      }
      smith.write(res, smith.destination(), (err, res) => {
        if (err) {
          log.error(err)
        }
        log.info('run end')
      })
    })
  }
  function build() {
    log.info('build')
    smith.build((err) => {
      if (err) {
        log.error(err)
      }
      log.info('build end')
    })
  }
  return watcher
}

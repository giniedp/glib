import {
  rollup,
  watch,
  RollupOptions,
  OutputOptions,
  RollupWatcherEvent,
} from 'rollup'
import getLogger from 'webpack-log'

const log = getLogger({
  name: 'rollup',
  timestamp: true,
})

export interface BundleWatchOptions {
  watch?: boolean
  onEvent?: (e: RollupWatcherEvent) => void
}

export async function rollupOrWatch(input: RollupOptions, output: OutputOptions, wo: BundleWatchOptions) {
  if (!wo.watch) {
    log.info('[BUNDLE]', output.name, '...')
    return rollup(input).then((b) => b.write(output)).then((res) => {
      log.info('[BUNDLE]', output.name, `finished`)
    })
  }
  return new Promise((resolve, reject) => {
    watch({
      ...input,
      output: output,
      watch: {
        clearScreen: false,
        skipWrite: false,
      },
    }).on('event', (event) => {
      if (event.code === 'BUNDLE_START') {
        log.info('[BUNDLE]', output.name, '...')
      }
      if (event.code === 'BUNDLE_END') {
        log.info('[BUNDLE]', output.name, `finished in ${(event.duration / 1000).toFixed(2)}s`)
      }
      if (event.code === 'ERROR') {
        log.error('[ERROR]', event.error.message)
      }
      wo.onEvent?.(event)
    })
  })
}

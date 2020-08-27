import { compile } from './compile'
import { bundle, bundleTests } from './bundle'
import context from '../context'
import { spawn, ChildProcess } from 'child_process'

export async function watch() {
  // make sure typescript is compiled
  // before rollup bundler starts watching
  await compile()
  return Promise.all([compile({ watch: true }), bundle({ watch: true })])
}

export async function watchTests() {
  // make sure typescript is compiled
  // before rollup bundler starts watching
  await compile()
  let karma: ChildProcess
  return Promise.all([
    compile({ watch: true }),
    bundleTests({
      watch: true,
      onEvent: (e) => {
        if (e.code === 'START') {
          karma?.kill()
          karma = null
        }
        if (e.code === 'END') {
          karma = spawn('karma', ['start', '--single-run'], {
            cwd: context.toolsDir(),
            stdio: [0, 1, 2],
          })
        }
      },
    }),
  ])
}

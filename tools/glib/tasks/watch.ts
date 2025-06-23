import { bundle } from './bundle'
import { compile } from './compile'

export async function watch() {
  // make sure typescript is compiled
  // before rollup bundler starts watching
  await compile()
  return Promise.all([compile({ watch: true }), bundle({ watch: true })])
}

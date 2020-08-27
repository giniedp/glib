import { compile } from './compile'
import { bundleTests } from './bundle'
import { spawn } from '@tools/utils'
import context from '../context'

export async function test() {
  await compile()
  await bundleTests()
  await spawn({
    cmd: `karma`,
    args: ['start', '--single-run'],
    cwd: context.toolsDir(),
    stdio: [0, 1, 2]
  })
}

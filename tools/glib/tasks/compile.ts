import project from '../context'
import { spawn } from '@tools/utils'

export function compile(options: { watch?: boolean } = {}) {
  return spawn({
    cmd: `tsc`,
    args: [
      '-b', ...project.glibPackages.map((pkg) => pkg.tsconfigPath),
      options.watch ? '-w' : null,
      '-preserveWatchOutput', // do not clear screen
    ],
    shell: true,
    stdio: 'inherit',
  })
}

import { project } from '../context'
import { spawn } from '../../utils'

export function compile(options: { watch?: boolean } = {}) {
  return spawn({
    cmd: `tsc`,
    args: [
      '-b',
      ...project.glibPackages.map((pkg) => pkg.tsconfigBuildPath),
      options.watch ? '-w' : null,
      '-preserveWatchOutput', // do not clear screen
    ],
    shell: true,
    stdio: 'inherit',
  })
}

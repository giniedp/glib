import project from '../context'
import { spawn } from '../../utils'

export function compile() {
  return spawn({
    cmd: `tsc`,
    args: ['-b', ...project.glibPackages.map((pkg) => pkg.subPath('tsconfig.json'))],
    shell: true,
    stdio: 'inherit',
  })
}

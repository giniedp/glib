import * as cp from 'child_process'
import context from '../context'

export function publish(): Promise<void> {
  context.glibPackages.forEach((pkg) => {
    cp.execSync(`cd ${pkg.pkgDir} && npm publish --access=public`, {
      stdio: [0, 1, 2],
    })
  })
  return Promise.resolve()
}

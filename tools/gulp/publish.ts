import * as cp from 'child_process'
import project from '../project'

export function publish(cb) {
  project.packages.forEach((pkg) => {
    cp.execSync(`cd ${project.pkgDstDir(pkg)} && npm publish --access=public`, {
      stdio: [0, 1, 2],
    })
  })
  if (cb) {
    cb()
  }
}

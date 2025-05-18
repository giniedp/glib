import { project } from '../context'
import { exec } from '../../utils'

export async function publish() {
  for (const pkg of project.glibPackages) {
    await exec(`cd ${pkg.pkgDir} && npm publish --access=public`, {})
  }
}

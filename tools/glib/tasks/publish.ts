import context from '../context'
import { exec } from '@tools/utils'

export async function publish() {
  for (const pkg of context.glibPackages) {
    await exec(`cd ${pkg.pkgDir} && npm publish --access=public`, {})
  }
}

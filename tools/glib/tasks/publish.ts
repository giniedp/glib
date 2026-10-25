import { spawnSync } from 'node:child_process'
import { project } from '../context'
import { build } from './build'

/**
 * Runs a command with the terminal attached, so prompts (npm login, one time passwords) work
 */
function run(command: string, cwd = project.dir) {
  const result = spawnSync(command, { cwd, shell: true, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(`command failed (${result.status}): ${command}`)
  }
}

function npmUser() {
  const result = spawnSync('npm whoami', { shell: true, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : null
}

/**
 * Logs in to npm unless already logged in
 */
export async function login() {
  let user = npmUser()
  if (!user) {
    console.log('not logged in to npm')
    run('npm login')
    user = npmUser()
  }
  if (!user) {
    throw new Error('npm login failed')
  }
  console.log(`logged in to npm as ${user}`)
}

/**
 * Publishes all packages as they are, without building
 *
 * @remarks
 * pnpm replaces the `workspace:` dependency ranges with the actual versions in the published package.json
 */
export async function publish() {
  for (const pkg of project.glibPackages) {
    console.log(`publishing ${pkg.packageName}`)
    run('pnpm publish --access public --no-git-checks', pkg.pkgDir)
  }
}

/**
 * Logs in to npm, builds and publishes all packages
 */
export async function release() {
  await login()
  await build()
  await publish()
}

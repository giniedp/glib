import { series, task } from 'gulp'
import * as path from 'path'
import project from '../project'
import { copyPackageFiles } from './update'
import { spawn } from './utils'

project.packages.forEach((pkg) => {
  task(`tsc:${pkg}`, () => spawn({
    cmd: `./node_modules/.bin/tsc -p ${project.pkgSrcDir(pkg, 'tsconfig.json')}`,
    shell: true,
    stdio: 'inherit',
  }))
})

export function compile() {
  return spawn({
    cmd: `./node_modules/.bin/tsc -p ${path.join(project.pkgSrc, 'tsconfig.json')}`,
    shell: true,
    stdio: 'inherit',
  })
}

task('compile', series(compile, copyPackageFiles))

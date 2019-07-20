import { task } from 'gulp'
import * as shell from 'shelljs'
import project from '../project'

export function publish(cb) {
  project.packages.forEach((pkg) => {
    shell.exec(`cd ${project.pkgDstDir(pkg)} npm publish`)
  })
  if (cb) {
    cb()
  }
}

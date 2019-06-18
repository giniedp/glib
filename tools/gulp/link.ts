import { task } from 'gulp'
import * as shell from 'shelljs'
import project from '../project'

export function link(cb) {
  project.packages.forEach((pkg) => {
    shell.exec(`cd ${project.pkgSrcDir(pkg)} npm link`)
  })
  if (cb) {
    cb()
  }
}

export function unlink(cb) {
  project.packages.forEach((pkg) => {
    shell.exec(`cd ${project.pkgSrcDir(pkg)} npm unlink`)
  })
  if (cb) {
    cb()
  }
}

task('link', link)
task('unlink', unlink)

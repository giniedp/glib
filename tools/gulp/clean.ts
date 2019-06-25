import * as del from 'del'
import { task } from 'gulp'
import project from '../project'

export function clean() {
  return del([project.dist])
}

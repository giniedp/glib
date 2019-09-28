import * as del from 'del'
import project from '../project'

export function clean() {
  return del([project.dist])
}

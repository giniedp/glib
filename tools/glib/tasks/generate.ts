import * as path from 'path'
import { dest, src } from 'gulp'
import generateEnums from './utils/gglib-enums'
import project from '../context'

export function generate() {
  const graphics = project.glibPackages.find((it) => it.packageName === '@gglib/graphics')
  return src(path.join(__dirname, '..', 'doc', 'enums.json'))
    .pipe(generateEnums({
      idl: path.join(__dirname, '..', 'doc', '*.idl'),
    }))
    .pipe(dest(graphics.srcDir('enums')))
}

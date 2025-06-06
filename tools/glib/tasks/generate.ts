import * as path from 'path'
import * as fs from 'fs'
import { generateEnums } from './utils/gglib-enums'
import { project } from '../context'

export function generate() {
  const graphics = project.glibPackages.find((it) => it.packageName === '@gglib/graphics')!
  const files = generateEnums({
    file: path.join(__dirname, '..', 'doc', 'enums.json').replace(/\\/g, '/'),
    idl: path.join(__dirname, '..', 'doc', '*.idl').replace(/\\/g, '/'),
  })
  for (const file of files) {
    fs.writeFileSync(graphics.srcDir('enums', file.name), file.content)
  }
}

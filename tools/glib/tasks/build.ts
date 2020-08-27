import { clean } from './clean'
import { bundle } from './bundle'
import { compile } from './compile'

export async function rebuild() {
  await clean()
  await compile()
  await bundle()
}

export async function build() {
  await compile()
  await bundle()
}

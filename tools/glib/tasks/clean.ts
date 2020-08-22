import * as del from 'del'
import context from '../context'

export async function clean() {
  return del(context.glibPackages.map((it) => it.distDir())).then((deleted) => {
    for (const it of deleted) {
      console.log('deleted', it)
    }
  })
}

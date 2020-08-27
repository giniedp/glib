import del from 'del'
import context from '../context'

export async function clean() {
  const directories = context.glibPackages.map((it) => it.distDir())
  const deleted = await del(directories)
  deleted.forEach((folder) => console.log('deleted', folder))
}

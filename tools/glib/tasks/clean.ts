import { deleteAsync } from 'del'
import { project } from '../context'

export async function clean() {
  const directories = project.glibPackages.map((it) => it.distDir())
  const deleted = await deleteAsync(directories, { force: true })
  deleted.forEach((folder) => console.log('deleted', folder))
}

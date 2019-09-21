import { series, watch } from 'gulp'
import project from '../project'
import { bundle as bundlePackages } from './bundle'
import { compilePackages } from './compile'
import { copyPackageFiles } from './update'

export const buildPackages = series(compilePackages, bundlePackages, copyPackageFiles)

export function watchPackages(end) {
  const w = watch(project.pkgSrc, { delay: 500 }, buildPackages)
  w.emit('change')

  process.on('SIGINT', () => {
    w.close()
    end()
    process.exit(1)
  })
}

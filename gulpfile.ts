import { parallel, series, task } from 'gulp'
import './tools/gulp'
import { api, docs } from './tools/gulp/api'
import { watchPackages } from './tools/gulp/build'
import { bundle } from './tools/gulp/bundle'
import { clean } from './tools/gulp/clean'
import { compilePackages } from './tools/gulp/compile'
import { link, unlink } from './tools/gulp/link'
import { page, serve, watchPage } from './tools/gulp/page'
import { publish } from './tools/gulp/publish'
import { copyPackageFiles, update } from './tools/gulp/update'

task(api)
task(bundle)
task(clean)
task(copyPackageFiles)
task(docs)
task(link)
task(serve)
task(unlink)
task(update)
task(watchPage)
task(watchPackages)

task('build', series(
  clean,
  update,
  compilePackages,
  bundle,
  copyPackageFiles,
  api,
  docs,
  page,
))

task('watch', parallel(
  serve,
  watchPage,
))

task('release', series('build', publish))

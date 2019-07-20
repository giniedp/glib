import { parallel, series, task } from 'gulp'
import './tools/gulp'
import { api, docs } from './tools/gulp/api'
import { assets, watchAssets } from './tools/gulp/assets'
import { watchPackages } from './tools/gulp/build'
import { bundle } from './tools/gulp/bundle'
import { clean } from './tools/gulp/clean'
import { compile } from './tools/gulp/compile'
import { link, unlink } from './tools/gulp/link'
import { serve, watchPage } from './tools/gulp/page'
import { publish } from './tools/gulp/publish'
import { copyPackageFiles, update } from './tools/gulp/update'

task(api)
task(assets)
task(bundle)
task(clean)
task(copyPackageFiles)
task(docs)
task(link)
task(serve)
task(unlink)
task(update)
task(watchAssets)
task(watchPage)
task(watchPackages)

task('build', series(
  clean,
  compile,
  bundle,
  api,
  docs,
))

task('watch', parallel(
  serve,
  watchAssets,
  watchPage,
  watchPackages,
))

task('release', series('build', publish))

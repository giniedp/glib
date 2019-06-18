import { parallel, task } from 'gulp'
import './tools/gulp'
import { assets } from './tools/gulp/assets'
import { watchPackages } from './tools/gulp/build'
import { serve, watchExamples } from './tools/gulp/examples'

task('watch', parallel(
  assets,
  serve,
  watchExamples,
  watchPackages,
))

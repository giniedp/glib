import {
  Extractor,
  ExtractorConfig,
  ExtractorResult,
} from '@microsoft/api-extractor'
import * as path from 'path'
import { Transform } from 'stream'
import vinyl = require('vinyl')

import { dest, series, src, task, parallel } from 'gulp'
import project, { GlibPackageContext } from '../context'
// import { convertMarkdownToHtml } from '../../gulp/plugins/transpile-md'
import { spawn, namedTask } from '../../utils'

async function runApiExtractor(pkg: GlibPackageContext) {
  return new Promise((resolve, reject) => {
    const apiExtractorJsonPath: string = pkg.distDir('api-extractor.json')

    // Load and parse the api-extractor.json file
    const extractorConfig: ExtractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath)

    // Invoke API Extractor
    const extractorResult: ExtractorResult = Extractor.invoke(extractorConfig, {
      // Equivalent to the "--local" command-line parameter
      localBuild: true,

      // Equivalent to the "--verbose" command-line parameter
      showVerboseMessages: true,
    })

    if (extractorResult.succeeded) {
      resolve()
    } else {
      reject(`API Extractor completed with ${extractorResult.errorCount} errors and ${extractorResult.warningCount} warnings`)
    }
  })
}

// project.glibPackages.forEach((pkg) => {
//   task(`glib:api:${pkg.baseName}`, () => runApiExtractor(pkg))
// })

export const api = parallel(
  ...project.glibPackages.map((pkg) => namedTask(pkg.packageName, () => runApiExtractor(pkg))),
)

// function mdToHtml() {
//   const template = require('pug').compile('extends /_layouts/_page\nblock content\n  #docs-page.container CONTENT', {
//     filename: 'template.pug',
//     basedir: project.pageSrc,
//     doctype: 'html',
//     pretty: true,
//   })({
//     project: project,
//     assetPath: (asset: string) => asset,
//   })

//   src([
//     'api/docs/*.md',
//   ])
//     .pipe(new Transform({
//       objectMode: true,
//       transform: function (file: any, encoding, cb) {
//         cb(null, new vinyl({
//           cwd: file.cwd,
//           base: file.base,
//           path: path.join(path.dirname(file.path), path.basename(file.path, '.md')) + '.html',
//           contents: Buffer.from(template.replace(/CONTENT/, convertMarkdownToHtml(file.path))),
//         }))
//       },
//       flush: (cb) => cb(),
//     }))
//     .pipe(dest(path.join(process.cwd(), 'tmp')))
// }

// export function docs() {
//   return spawn({
//     cmd: './node_modules/.bin/api-documenter markdown -i api -o api/docs',
//     shell: true,
//     stdio: 'inherit',
//   }).then(() => {
//     mdToHtml()
//   })
// }

import {
  Extractor,
  ExtractorConfig,
  ExtractorResult,
} from '@microsoft/api-extractor'
import * as path from 'path'
import { Transform } from 'stream'
import vinyl = require('vinyl')

import { dest, series, src, task } from 'gulp'
import project from '../project'
import { convertMarkdownToHtml } from './plugins/transpile-md'
import { spawn } from './utils'

async function runApiExtractor(pkg: string) {
  return new Promise((resolve, reject)  => {
    const apiExtractorJsonPath: string = project.pkgSrcDir(pkg, 'api-extractor.json')

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

project.packages.forEach((pkg) => {
  task(`api:${pkg}`, () => runApiExtractor(pkg))
})

export function api(cb) {
  series(project.packages.map((pkg) => `api:${pkg}`))(cb)
}

function mdToHtml() {
  const template = require('pug').compile('extends /_layouts/_page\nblock content\n  #docs-page.container CONTENT', {
    filename: 'template.pug',
    basedir: project.pageSrc,
    doctype: 'html',
    pretty: true,
  })({})

  src([
    'api/docs/*.md',
  ])
  .pipe(new Transform({
    objectMode: true,
    transform: function(file: any, encoding, cb) {
      cb(null, new vinyl({
        cwd: file.cwd,
        base: file.base,
        path: path.join(path.dirname(file.path), path.basename(file.path, '.md')) + '.html',
        contents: Buffer.from(template.replace(/CONTENT/, convertMarkdownToHtml(file.path))),
      }))
    },
    flush: (cb) => cb(),
  }))
  .pipe(dest(path.join(project.dist, 'docs')))
}

export function docs() {
  return spawn({
    cmd: './node_modules/.bin/api-documenter markdown -i api -o api/docs',
    shell: true,
    stdio: 'inherit',
  }).then(() => {
    mdToHtml()
  })
}

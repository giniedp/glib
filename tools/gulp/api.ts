import {
  Extractor,
  ExtractorConfig,
  ExtractorResult,
} from '@microsoft/api-extractor'

import { series, task, watch } from 'gulp'
import project from '../project'
import { spawn } from './utils';

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

export function docs() {
  return spawn({
    cmd: './node_modules/.bin/api-documenter markdown -i api -o docs',
    shell: true,
    stdio: 'inherit',
  })
}

task(api)
task(docs)

import {
  Extractor,
  ExtractorConfig,
  ExtractorResult,
} from '@microsoft/api-extractor'

import { parallel } from 'gulp'
import project, { GlibPackageContext } from '../context'

import { spawn, namedTask } from '../../utils'

async function runApiExtractor(pkg: GlibPackageContext) {
  return new Promise((resolve, reject) => {
    const apiExtractorJsonPath: string = pkg.subPath('api-extractor.json')

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
      resolve(void 0)
    } else {
      reject(`API Extractor completed with ${extractorResult.errorCount} errors and ${extractorResult.warningCount} warnings`)
    }
  })
}

export const api = parallel(
  ...project.glibPackages.map((pkg) => namedTask(pkg.packageName, () => runApiExtractor(pkg))),
)

export async function docs() {
  return spawn({
    cmd: 'api-documenter markdown -i api -o apps/web/src/docs/api',
    shell: true,
    stdio: 'inherit',
  })
}

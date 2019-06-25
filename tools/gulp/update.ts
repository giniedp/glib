import * as fs from 'fs'
import { dest, parallel, src, task } from 'gulp'
import * as path from 'path'
import project from '../project'

function namedTask(name: string, aTask: () => any) {
  return Object.assign(aTask, { displayName: name }) // tslint:disable-line
}

function updatePackageJson(pkg: string) {
  return new Promise((resolve) => {
    fs.writeFile(project.pkgSrcDir(pkg, 'package.json'), JSON.stringify({
      name: `@gglib/${pkg}`,
      description: 'Part of the [G]glib project',
      version: project.packageJson.version,
      repository: project.packageJson.repository,
      keywords: project.packageJson.keywords,
      author: project.packageJson.author,
      license: project.packageJson.license,
      main: `./bundles/${pkg}.umd.js`,
      module: `./index.js`,
      typings: `./index.d.ts`,
      peerDependencies: project.pkgPeerDependencies(pkg).reduce((result, peer) => {
        result[peer] = project.packageJson.version
        return result
      }, {}),
    }, null, 2), resolve)
  })
}

function updateTsconfigJson(pkg: string) {
  return new Promise((resolve) => {
    fs.writeFile(project.pkgSrcDir(pkg, 'tsconfig.json'), JSON.stringify({
      extends: '../tsconfig.json',
      baseUrl: '.',
      rootDir: '.',
    }, null, 2), resolve)
  })
}

function updateReadme(pkg: string) {
  const pj = project.packageJson
  return new Promise((resolve, reject) => {
    fs.writeFile(project.pkgSrcDir(pkg, 'Readme.md'), `
[![Coverage Status](https://coveralls.io/repos/github/giniedp/glib/badge.svg?branch=master)](https://coveralls.io/github/giniedp/glib?branch=master)
[![Build Status](https://travis-ci.org/giniedp/glib.svg?branch=master)](https://travis-ci.org/giniedp/glib)

[G]glib - ${pkg}
=======
${pj.description}

To find out more about this project visit [the repository](https://github.com/giniedp/glib) or the [project page](https://glib.ginie.eu)

Licence: ${pj.license}
    `.trim(), resolve)
  })
}

function updateApiExtractorJson(pkg: string) {
  const pathToRoot = path.relative(project.pkgSrcDir(pkg), project.root)
  const pathToDist = path.relative(project.pkgSrcDir(pkg), project.pkgDstDir(pkg))
  return new Promise((resolve, reject) => {
    fs.writeFile(project.pkgSrcDir(pkg, 'api-extractor.json'), JSON.stringify({
      $schema: 'https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json',
      projectFolder: '.',
      mainEntryPointFilePath: '<projectFolder>/' + path.join(pathToDist, `index.d.ts`),
      compiler: {
        tsconfigFilePath: '<projectFolder>/tsconfig.json',
      },
      apiReport: {
        enabled: false,
        reportFileName: `${pkg}.api.md`,
        reportFolder: '<projectFolder>/' + path.join(pathToRoot, `etc`),
        reportTempFolder: '<projectFolder>/' + path.join(pathToRoot, `temp`),
      },

      docModel: {
        enabled: true,
        apiJsonFilePath: '<projectFolder>/' + path.join(pathToRoot, 'api', `${pkg}.api.json`),
      },

      dtsRollup: {
        enabled: false,
      },

      tsdocMetadata: {
        enabled: false,
      },

      messages: {
        compilerMessageReporting: {
          default: {
            logLevel: 'warning',
          },
        },
        extractorMessageReporting: {
          default: {
            logLevel: 'warning',
          },
        },

        tsdocMessageReporting: {
          default: {
            logLevel: 'warning',
          },
        },
      },
    }, null, 2), resolve)
  })
}

function updatePackage(pkg: string) {
  return Promise.all([
    updatePackageJson(pkg),
    updateTsconfigJson(pkg),
    updateApiExtractorJson(pkg),
    updateReadme(pkg),
  ])
}

export function update(cb) {
  return parallel(
    ...project.packages.map((pkg) => namedTask(`update:${pkg}`, () => updatePackage(pkg))),
  )(cb)
}

export function copyPackageFiles() {
  return src([
    project.pkgSrcDir('*', 'package.json'),
    project.pkgSrcDir('*', 'Readme.md'),
  ]).pipe(dest(path.join(project.dist, 'packages')))
}

import * as path from 'path'
import context, { GlibPackageContext } from '../context'
import { writeFile } from '../../utils'

async function updateSrcPackageJson(pkg: GlibPackageContext) {
  const newPkgJson = JSON.stringify(
    {
      name: pkg.packageName,
      description: 'Part of the [G]glib project',
      version: context.packageJson.version,
      repository: context.packageJson.repository,
      keywords: context.packageJson.keywords,
      author: context.packageJson.author,
      license: context.packageJson.license,
      index: path.relative(pkg.pkgDir, pkg.distDir('bundles', pkg.baseName + '.umd.js')),
      module: path.relative(pkg.pkgDir, pkg.distDir(pkg.baseName, 'src', 'index.js')),
      typings: path.relative(pkg.pkgDir, pkg.distDir(pkg.baseName, 'src', 'index.d.ts')),
      devDependencies: pkg.glibReferences.reduce((result, peer) => {
        result[peer] = context.packageJson.version
        return result
      }, {}),
      peerDependencies: pkg.glibReferences.reduce((result, peer) => {
        result[peer] = context.packageJson.version
        return result
      }, {}),
      files: ['package.json', 'dist', 'Readme.md'],
    },
    null,
    2,
  )
  return writeFile(pkg.subPath('package.json'), newPkgJson)
}

function updateSrcTsconfig(pkg: GlibPackageContext) {
  return writeFile(
    pkg.subPath('tsconfig.json'),
    JSON.stringify(
      {
        extends: path.relative(pkg.pkgDir, context.packagesDir('tsconfig.tsc.json')),
        baseUrl: '.',
        rootDir: '.',
        compilerOptions: {
          composite: true,
          outDir: './dist',
        },
        include: ['./index.ts', './src/**/*.ts'],
        exclude: ['./dist/**/*', './node_modules/**/*'],
        references: pkg.glibReferences.map((it) => {
          const ref = context.glibPackages.find((p) => p.packageName === it)
          return { path: path.relative(pkg.pkgDir, path.join(ref.pkgDir, 'tsconfig.json')) }
        }),
      },
      null,
      2,
    ),
  )
}

function updateSpecTsconfig() {
  return writeFile(
    context.packagesDir('tsconfig.cjs.json'),
    JSON.stringify(
      {
        extends: './tsconfig.tsc.json',
        compilerOptions: {
          outDir: '../dist/cjs',
          module: 'commonjs',
          paths: {
            '@gglib/*': ['./*'],
          },
        },
      },
      null,
      2,
    ),
  )
}

function updateSrcReadme(pkg: GlibPackageContext) {
  const pj = context.packageJson
  return writeFile(
    pkg.subPath('Readme.md'),
    `
[![Coverage Status](https://coveralls.io/repos/github/giniedp/glib/badge.svg?branch=master)](https://coveralls.io/github/giniedp/glib?branch=master)
[![Build Status](https://travis-ci.org/giniedp/glib.svg?branch=master)](https://travis-ci.org/giniedp/glib)

[G]glib - ${pkg}
=======
${pj.description}

To find out more about this project visit [the repository](https://github.com/giniedp/glib) or the [project page](https://glib.ginie.eu)

Licence: ${pj.license}
    `.trim(),
  )
}

function updateSrcApiExtractor(pkg: GlibPackageContext) {
  const pathToRoot = path.relative(pkg.pkgDir, context.dir)
  const pathToDist = path.relative(pkg.pkgDir, pkg.distDir())
  return writeFile(
    pkg.distDir('api-extractor.json'),
    JSON.stringify(
      {
        $schema: 'https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json',
        projectFolder: '.',
        mainEntryPointFilePath: '<projectFolder>/' + path.join(pathToDist, `index.d.ts`),
        compiler: {
          tsconfigFilePath: '<projectFolder>/tsconfig.json',
        },
        apiReport: {
          enabled: false,
          reportFileName: `${pkg.baseName}.api.md`,
          reportFolder: '<projectFolder>/' + path.join(pathToRoot, `etc`),
          reportTempFolder: '<projectFolder>/' + path.join(pathToRoot, `temp`),
        },

        docModel: {
          enabled: true,
          apiJsonFilePath: '<projectFolder>/' + path.join(pathToRoot, 'api', `${pkg.baseName}.api.json`),
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
      },
      null,
      2,
    ),
  )
}

async function updateSrcPackage(pkg: GlibPackageContext) {
  await updateSrcPackageJson(pkg)
  return Promise.all([
    updateSrcTsconfig(pkg),
    updateSpecTsconfig(),
    // updateSrcApiExtractor(pkg),
    updateSrcReadme(pkg),
  ])
}

export async function update() {
  return context.glibPackages.map(updateSrcPackage)
}

import path from 'node:path'
import { writeFile } from '../../utils'
import { GlibPackageContext, project } from '../context'

async function updateSrcPackageJson(pkg: GlibPackageContext) {
  const newPkgJson = JSON.stringify(
    {
      name: pkg.packageName,
      description: 'Part of the [G]glib project',
      version: project.packageJson.version,
      repository: project.packageJson.repository,
      keywords: project.packageJson.keywords,
      author: project.packageJson.author,
      license: project.packageJson.license,
      index: path.relative(pkg.pkgDir, pkg.distDir('bundles', pkg.baseName + '.umd.js')),
      module: path.relative(pkg.pkgDir, pkg.distDir(pkg.baseName, 'src', 'index.js')),
      main: path.relative(pkg.pkgDir, pkg.distDir(pkg.baseName, 'src', 'index.js')),
      typings: path.relative(pkg.pkgDir, pkg.distDir(pkg.baseName, 'src', 'index.d.ts')),
      devDependencies: pkg.glibReferences.reduce((result, peer) => {
        result[peer] = `workspace:^${project.packageJson.version}`
        return result
      }, {}),
      peerDependencies: pkg.glibReferences.reduce((result, peer) => {
        if (pkg.packageName !== '@gglib/gglib') {
          result[peer] = project.packageJson.version
        }
        return result
      }, {}),
      files: ['package.json', 'dist', 'Readme.md'],
    },
    null,
    2,
  )
  return writeFile(pkg.subPath('package.json'), newPkgJson)
}
function updateTsconfig(pkg: GlibPackageContext) {
  return writeFile(
    pkg.subPath('tsconfig.json'),
    JSON.stringify(
      {
        references: [{ path: './tsconfig.build.json' }, { path: './tsconfig.spec.json' }],
      },
      null,
      2,
    ),
  )
}

function updateTsconfigBuild(pkg: GlibPackageContext) {
  return writeFile(
    pkg.subPath('tsconfig.build.json'),
    JSON.stringify(
      {
        extends: path.posix.relative(pkg.pkgDir, project.packagesDir('tsconfig.tsc.json')),
        baseUrl: '.',
        rootDir: '.',
        compilerOptions: {
          composite: true,
          outDir: './dist',
        },
        include: ['./index.ts', './src/**/*.ts', './src/**/*.js'],
        exclude: [
          './dist/**/*',
          './node_modules/**/*',
          './**/*.spec.ts',
          './**/*.spec.js',
          './**/*.test.ts',
          './**/*.test.js',
          './**/*.bench.ts',
          './**/*.bench.js',
        ],
        references: pkg.glibReferences.map((it) => {
          const ref = project.glibPackages.find((p) => p.packageName === it)!
          return {
            path: path.posix.relative(pkg.pkgDir, path.posix.join(ref.pkgDir, 'tsconfig.build.json')),
          }
        }),
      },
      null,
      2,
    ),
  )
}

function updateTsconfigSpec(pkg: GlibPackageContext) {
  return writeFile(
    pkg.subPath('tsconfig.spec.json'),
    JSON.stringify(
      {
        extends: './tsconfig.build.json',
        include: ['./index.ts', './src/**/*.ts', './src/**/*.js'],
        exclude: ['./dist/**/*', './node_modules/**/*'],
      },
      null,
      2,
    ),
  )
}
// function updateTsconfigSpec() {
//   return writeFile(
//     project.packagesDir('tsconfig.cjs.json'),
//     JSON.stringify(
//       {
//         extends: './tsconfig.tsc.json',
//         compilerOptions: {
//           outDir: '../dist/cjs',
//           module: 'commonjs',
//           paths: {
//             '@gglib/*': ['./*'],
//           },
//         },
//       },
//       null,
//       2,
//     ),
//   )
// }

function updateSrcReadme(pkg: GlibPackageContext) {
  const pj = project.packageJson
  return writeFile(
    pkg.subPath('Readme.md'),
    `
[![Coverage Status](https://coveralls.io/repos/github/giniedp/glib/badge.svg?branch=master)](https://coveralls.io/github/giniedp/glib?branch=master)
[![Build Status](https://travis-ci.org/giniedp/glib.svg?branch=master)](https://travis-ci.org/giniedp/glib)

[G]glib - ${pkg.packageName}
=======
${pj.description}

To find out more about this project visit [the repository](https://github.com/giniedp/glib) or the [project page](https://glib.ginie.eu)

Licence: ${pj.license}
    `.trim(),
  )
}

function updateSrcApiExtractor(pkg: GlibPackageContext) {
  const pathToRoot = path.relative(pkg.pkgDir, project.dir)
  const pathToDist = path.relative(pkg.pkgDir, pkg.distDir())
  return writeFile(
    pkg.subPath('api-extractor.json'),
    JSON.stringify(
      {
        $schema: 'https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json',
        projectFolder: '.',
        mainEntryPointFilePath: '<projectFolder>/' + path.relative(pkg.dir, pkg.tscOutDir('index.d.ts')),
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
  // prettier-ignore
  return Promise.all([
    updateTsconfig(pkg),
    updateTsconfigBuild(pkg),
    updateTsconfigSpec(pkg),
    updateSrcApiExtractor(pkg),
    updateSrcReadme(pkg),
  ])
}

export async function update() {
  return project.glibPackages.map(updateSrcPackage)
}

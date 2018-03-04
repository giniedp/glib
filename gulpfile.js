'use strict'

const fs = require('fs')
const del = require('del')
const path = require('path')
const glob = require('glob')
const gulp = require('gulp')
const shell = require('shelljs')
const rollup = require('rollup')

const dstDir = path.join(__dirname, 'dist')
const srcDir = path.join(__dirname, 'packages')

const projectName = 'gglib'
const modules = ['bundles', 'esm5', 'esm2015']
const packages = (() => {
  return glob
    .sync(path.join(srcDir, '*'))
    .filter((it) => it.indexOf('.') === -1)
    .map((it) => path.basename(it))
})()

function compileReadme(pkg, pj) {
  return `
[![Coverage Status](https://coveralls.io/repos/github/giniedp/glib/badge.svg?branch=master)](https://coveralls.io/github/giniedp/glib?branch=master)
[![Build Status](https://travis-ci.org/giniedp/glib.svg?branch=master)](https://travis-ci.org/giniedp/glib)

[G]glib - ${pkg}
=======
${pj.description}

To find out more about this project visit [the repository](https://github.com/giniedp/glib) or the [project page](https://glib.ginie.eu)

Licence: ${pj.license}
`.trim()
}

function findPeers(pkg) {
  const src = path.join(srcDir, pkg)
  const result = []
  glob.sync(`${src}/**/*.ts`).forEach((file) => {
    const match = fs.readFileSync(file).toString().match(/from '@gglib\/(\w+)'/g);

    (match || []).forEach((value) => {
      const m = value.match(/from '@gglib\/(\w+)'/)
      if (!m || !m[1]) {
        return
      }
      const name = m[1].split('/').shift()
      if (result.indexOf(name) === -1 && name !== path.basename(src)) {
        result.push(name)
      }
    })
  })
  return result.map((it) => `@gglib/${it}`)
}


gulp.task('clean', () => del(dstDir))

gulp.task('build:tsc', ['clean'], (cb) => {
  shell
    .exec('tsc -p packages/tsconfig.json', { async: true })
    .on('exit', (code) => cb(code === 0 ? null : code))
})

gulp.task('build:tsc:esm5', ['clean'], (cb) => {
  shell
    .exec('tsc -p packages/tsconfig.esm5.json', { async: true })
    .on('exit', (code) => cb(code === 0 ? null : code))
})

gulp.task('build:tsc:esm2015', ['clean'], (cb) => {
  shell
    .exec('tsc -p packages/tsconfig.esm2015.json', { async: true })
    .on('exit', (code) => cb(code === 0 ? null : code))
})

const rollupTasks = []
for (const p of packages) {
  const pkgName = p
  const taskName = `build:rollup:${pkgName}`
  rollupTasks.push(taskName)
  gulp.task(taskName, ['build:tsc:esm5'], () => {
    const alias = require('rollup-plugin-alias')
    const resolve = require('rollup-plugin-node-resolve')
    const sourcemaps = require('rollup-plugin-sourcemaps')
    const globals = {}
    const aliase = {}
    function moduleName(name) {
      if (name === projectName) {
        return 'Gglib'
      }
      return 'Gglib.' + name[0].toUpperCase() + name.substr(1)
    }
    for (const name of packages) {
      if (pkgName !== projectName) {
        globals[`@gglib/${name}`] = moduleName(name)
      }
      aliase[`@gglib/${name}`] = path.join(dstDir, 'esm5', name, 'index.js')
    }

    return rollup.rollup({
      amd: {id: `@gglib/${pkgName}`},
      input: path.join(dstDir, 'esm5', pkgName, 'index.js'),
      onwarn: (warning, warn) => {
        if (warning.code === 'THIS_IS_UNDEFINED') {return}
        warn(warning);
      },
      plugins: [resolve(), alias(aliase), sourcemaps()],
      external: Object.keys(globals),
    })
    .then((bundle) => {
      return bundle.write({
        format: 'umd',
        sourcemap: true,
        file: path.join(dstDir, 'bundles', pkgName, pkgName + '.umd.js'),
        name: moduleName(pkgName),
        globals: globals,
        exports: 'named',
      })
    })
  })
}

gulp.task('build:rollup', rollupTasks)

const mergeTasks = []
for (const m of modules) {
  for (const p of packages) {
    if (p === projectName && m !== 'bundles') {
      // do not compile esm5 and esm2015 versions for glib package
      continue
    }
    const pkgName = p
    const moduleName = m
    const taskName = `build:${moduleName}:${pkgName}`
    mergeTasks.push(taskName)
    gulp.task(taskName, ['build:tsc:esm5', 'build:tsc:esm2015', 'build:rollup'], () => {
      return gulp
        .src(path.join(dstDir, moduleName, pkgName, '**', '*'))
        .pipe(gulp.dest(path.join(dstDir, 'packages', pkgName, moduleName)))
    })
  }
}

gulp.task('build', mergeTasks, () => {
  packages.forEach((pkg) => {
    const pkgDir = path.join(dstDir, 'packages', pkg);
    const pkgPath = path.join(pkgDir, 'package.json')
    const pkgJson = require(path.join(__dirname, 'package.json'))
    const readmePath =  path.join(pkgDir, 'README.md')

    // create missing files
    fs.writeFileSync(pkgPath, '')
    fs.writeFileSync(readmePath, '')

    // generate pkgJson defintion
    const pkgDef = {
      name: `@gglib/${pkg}`,
      description: 'Part of the [G]glib project',
      version: pkgJson.version,
      repository: pkgJson.repository,
      keywords: pkgJson.keywords,
      author: pkgJson.author,
      license: pkgJson.license,
      main: `./bundles/${pkg}.umd.js`,
      module: './esm5/index.js',
      es2015: './esm2015/index.js',
      typings: './esm2015/index.d.ts',
      files: glob
        .sync(path.join(pkgDir, '*'))
        .map((it) => it.replace(pkgDir + '/', '')),
      scripts: {},
      peerDependencies: {},
      dependencies: {},
      devDependencies: {},
    }
    if (pkg === projectName) {
      pkgDef.module = pkgDef.main
      delete pkgDef.es2015
      delete pkgDef.typings
      pkgDef.description = 'Standalone bundle of the [G]glib project'
    } else {
      findPeers(pkg).forEach((it) => {
        pkgDef.peerDependencies[it] = pkgDef.version
      })
    }

    // write files
    fs.writeFileSync(pkgPath, JSON.stringify(pkgDef, null, 2))
    fs.writeFileSync(readmePath, compileReadme(pkg, pkgDef))
  })

  modules.forEach((name) => del(path.join(dstDir, name)))
})

gulp.task('publish', ['build'], () => {
  packages.forEach((name) => {
    shell.exec(`npm publish ./dist/packages/${name} --access=public`, { async: true })
  })
})

'use strict'

const fs = require('fs')
const del = require('del')
const path = require('path')
const glob = require('glob')
const gulp = require('gulp')
const notify = require('gulp-notify')
const shell = require('shelljs')
const rollup = require('rollup')
const through = require('through-gulp')

const dstDir = path.join(__dirname, 'dist')
const srcDir = path.join(__dirname, 'packages')
const docDir = path.join(dstDir, 'doc')

const projectName = 'gglib'
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
    .on('exit', (code) => {
      if (code === 0) {
        cb()
      } else {
        notify.onError({
          title: 'build:tsc',
          message: `Error Code: ${code}`
        })(new Error(`Error Code: ${code}`));
        cb(code)
      }
    })
})

const rollupTasks = []
function createRollupTask(pkgName) {
  const taskName = `build:rollup:${pkgName}`
  rollupTasks.push(taskName)
  gulp.task(taskName, ['build:tsc'], () => {
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
      aliase[`@gglib/${name}`] = path.join(dstDir, 'packages', name, 'index.js')
    }

    return rollup.rollup({
      amd: {id: `@gglib/${pkgName}`},
      input: path.join(dstDir, 'packages', pkgName, 'index.js'),
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
        file: path.join(dstDir, 'packages', pkgName, 'bundles', pkgName + '.umd.js'),
        name: moduleName(pkgName),
        globals: globals,
        exports: 'named',
      })
    })
  })
}
packages.forEach(createRollupTask)

gulp.task('build:rollup', rollupTasks)

gulp.task('build:typings', ['build:tsc'], (done) => {
  const parent = path.join(dstDir, 'packages')
  return gulp
    .src(path.join(parent, '**', '*.d.ts'))
    .pipe(through(function(file, enc, cb) {
      const content = file.contents.toString().replace(/^import (.*) from '(@gglib)\/(.*)'/gm, (match, what, _, pkg) => {
        pkg = path.relative(path.dirname(file.path), path.join(parent, pkg))
        return `import ${what} from '${pkg}'`
      })
      file.contents = new Buffer(content)
      cb(null, file)
    }))
    .on('error', (error) => done(error))
    .pipe(gulp.dest(path.join(parent, projectName, 'src')))
    .on('end’', () => done())
})

gulp.task('build', ['build:tsc', 'build:rollup', 'build:typings'], () => {
  packages.forEach((pkg) => {
    const pkgDir = path.join(dstDir, 'packages', pkg);
    const pkgPath = path.join(pkgDir, 'package.json')
    const pkgJson = require(path.join(__dirname, 'package.json'))
    const readmePath =  path.join(pkgDir, 'README.md')

    // create missing files
    fs.writeFileSync(pkgPath, '')           // package.json
    fs.writeFileSync(readmePath, '')        // README.md
    fs.mkdirSync(path.join(pkgDir, 'doc'))  // doc

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
      module: './index.js',
      typings: './index.d.ts',
      files: glob
        .sync(path.join(pkgDir, '*'))
        .map((it) => it.replace(pkgDir + '/', '')),
      scripts: {},
      peerDependencies: {},
      dependencies: {},
      devDependencies: {},
    }
    if (pkg === projectName) {
      delete pkgDef.es2015
      pkgDef.module = pkgDef.main
      pkgDef.typings = './src/gglib/index.d.ts'
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
})

gulp.task('publish', ['build', 'api:json'], () => {
  packages.forEach((name) => {
    shell.exec(`npm publish ./dist/packages/${name} --access=public`, { async: true })
  })
})

const apiTasks = []
packages.forEach((pkg) => {
  const taskName = `api:${pkg}`
  apiTasks.push(taskName)
  gulp.task(taskName, ['build'], () => {
    const ae = require('@microsoft/api-extractor')
    new ae.Extractor({
      compiler: {
        configType: 'tsconfig',
        rootFolder: srcDir
      },
      project: {
        entryPointSourceFile: path.join(dstDir, 'packages', pkg, 'index.d.ts')
      },
      apiReviewFile: {
        enabled: false
      },
      apiJsonFile: {
        enabled: true,
        outputFolder: path.join(dstDir, 'packages', pkg, 'doc')
      }
    }, {
      localBuild: true,
    }).processProject();
  })
})

gulp.task('api:json', apiTasks, (done) => {
  return gulp
    .src(packages.map((name) => path.join(dstDir, 'packages', name, 'doc', '*.api.json')))
    .pipe(gulp.dest(path.join(docDir, 'input')))
    .on('error', (error) => done(error))
    .on('end’', () => done())
})

gulp.task('api:markdown', ['api:json'], (cb) => {
  shell
    .exec('cd dist/doc && mkdir -p markdown && api-documenter markdown', { async: true })
    .on('exit', (code) => cb(code === 0 ? null : code))
})

gulp.task('watch:docs', [], () => {
  gulp.watch(path.join(srcDir, '**', '*.ts'), ['api:json'])
  gulp.start('api:json')
})

gulp.task('watch', [], () => {
  gulp.watch(path.join(srcDir, '**', '*.ts'), ['build'])
  gulp.start('build')
})

gulp.task('generate:enums', (done) => {
  return gulp
    .src('tools/enums.json')
    .pipe(require('./tools/gulp/plugins/gglib-enums.js')({
      idl: ['tools/doc/*.idl']
    }))
    .on('error', (error) => done(error))
    .pipe(gulp.dest('dist'))
    .on('end’', () => done())
})

gulp.task('link', () => {
  packages.forEach((name) => {
    console.log(`linking ${name}`)
    shell.exec(`cd ${dstDir}/packages/${name} && npm link`)
  })
})

gulp.task('unlink', () => {
  packages.forEach((name) => {
    console.log(`unlinking ${name}`)
    shell.exec(`cd ${dstDir}/packages/${name} && npm unlink`)
  })
})

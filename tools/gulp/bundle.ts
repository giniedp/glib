import { parallel, task } from 'gulp'
import { rollup } from 'rollup'
import project from '../project'

async function rollupPackage(pkg: string) {
  const alias = require('rollup-plugin-alias')
  const resolve = require('rollup-plugin-node-resolve')
  const sourcemaps = require('rollup-plugin-sourcemaps')

  const globals = {}
  const aliase = {}
  for (const name of project.packages) {
    if (pkg !== 'gglib') {
      globals[project.pkgName(name)] = project.pkgGlobalName(name)
    }
    aliase[project.pkgName(name)] = project.pkgDstDir(name, 'index.js')
  }

  await rollup({
    input: project.pkgDstDir(pkg, 'index.js'),
    onwarn: (warning, warn) => {
      if (warning['code'] === 'THIS_IS_UNDEFINED') {return}
      warn(warning)
    },
    plugins: [
      resolve(),
      alias(aliase),
      sourcemaps(),
    ],
    external: Object.keys(globals),
  })
  .then((b) => {
    return b.write({
      amd: {
        id: project.pkgName(pkg),
      },
      format: 'umd',
      sourcemap: true,
      file: project. pkgDstDir(pkg, 'bundles', pkg + '.umd.js'),
      name: project.pkgGlobalName(pkg),
      globals: globals,
      exports: 'named',
    })
  })
}

project.packages.forEach((pkg) => {
  task(`bundle:${pkg}`, () => rollupPackage(pkg))
})

export function bundle(done) {
  parallel(
    ...project.packages.map((pkg) => `bundle:${pkg}`),
  )(done)
}

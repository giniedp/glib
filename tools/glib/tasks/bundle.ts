import { rollup } from 'rollup'
import project, { GlibPackageContext } from '../context'
import { parallel } from 'gulp'
import { namedTask } from '../../utils'

async function rollupPackage(pkg: GlibPackageContext) {
  const alias = require('@rollup/plugin-alias')
  const { nodeResolve } = require('@rollup/plugin-node-resolve')
  const sourcemaps = require('rollup-plugin-sourcemaps')

  const globals = {}
  const entries = {}

  for (const it of project.glibPackages) {
    if (pkg.baseName !== 'gglib') {
      globals[it.packageName] = it.globalName
    }
    entries[it.packageName] = it.distDir(it.baseName, 'src', 'index.js')
  }

  await rollup({
    input: pkg.distDir(pkg.baseName, 'src', 'index.js'),
    onwarn: (warning, warn) => {
      if (warning['code'] === 'THIS_IS_UNDEFINED') {
        return
      }
      warn(warning)
    },
    plugins: [
      nodeResolve(),
      alias({
        entries: entries,
      }),
      sourcemaps(),
    ],
    external: Object.keys(globals),
  }).then((b) => {
    return b.write({
      amd: {
        id: pkg.globalName,
      },
      format: 'umd',
      sourcemap: true,
      file: pkg.distDir('bundles', pkg.baseName + '.umd.js'),
      name: pkg.globalName,
      globals: globals,
      exports: 'named',
    })
  })
}

export const bundle = parallel(
  project.glibPackages.map((pkg) => {
    return namedTask(`bundle:${pkg.baseName}`, () => rollupPackage(pkg))
  }),
)

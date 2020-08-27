import { RollupOptions, OutputOptions } from 'rollup'
import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import multi from '@rollup/plugin-multi-entry'
import visualizer from 'rollup-plugin-visualizer'

import context, { GlibPackageContext } from '../context'
import { rollupOrWatch, BundleWatchOptions, rollupIgnoreWarnings, rollupIstanbulInstrumenter } from './plugins'

export function bundle(options: { watch?: boolean } = {}) {
  return Promise.all(context.glibPackages.map((pkg) => rollupPackage(pkg, options)))
}

export const bundleTests = rollupTests

const IS_COVERAGE = !!process.env.IS_COVERAGE

async function rollupPackage(pkg: GlibPackageContext, options: BundleWatchOptions = {}) {
  const [entries, globals] = resolveAliases(pkg.baseName !== 'gglib')
  const inputOptions: RollupOptions = {
    input: pkg.tscOutDir('index.js'),
    onwarn: rollupIgnoreWarnings(['THIS_IS_UNDEFINED']),
    plugins: [
      nodeResolve(),
      alias({
        entries: entries,
      }),
      sourcemaps(),
      visualizer({
        file: pkg.distDir('stats.html'),
      }),
    ],
    external: Object.keys(globals),
  }
  const outputOptions: OutputOptions = {
    amd: { id: pkg.globalName },
    format: 'umd',
    sourcemap: true,
    file: pkg.rollupOutDir(pkg.baseName + '.umd.js'),
    name: pkg.globalName,
    globals: globals,
    exports: 'named',
  }
  return rollupOrWatch(inputOptions, outputOptions, options)
}

async function rollupTests(options: BundleWatchOptions = {}) {
  const [entries, globals] = resolveAliases(false)
  const pkgs = context.glibPackages.filter((it) => !it.isRootModule)
  const globSpecs = pkgs.map((pkg) => pkg.tscOutDir('**', '*.spec.js'))
  const globSrc = pkgs.map((pkg) => pkg.tscOutDir('**', '*.js'))
  const inputOptions: RollupOptions = {
    input: globSpecs,
    onwarn: rollupIgnoreWarnings(['THIS_IS_UNDEFINED']),
    plugins: [
      multi(),
      nodeResolve(),
      alias({
        entries: entries,
      }),
      sourcemaps(),
      IS_COVERAGE
        ? rollupIstanbulInstrumenter({
            include: globSrc,
            exclude: globSpecs,
          })
        : null,
    ].filter((it) => it != null),
    external: Object.keys(globals),
  }
  const outputOptions: OutputOptions = {
    format: 'cjs',
    sourcemap: true,
    file: context.toolsDir('test', 'index.spec.js'),
    name: 'TEST',
    globals: globals,
  }
  return rollupOrWatch(inputOptions, outputOptions, options)
}

function resolveAliases(andGlobals: boolean) {
  const globals: Record<string, string> = {}
  const entries: Record<string, string> = {}
  for (const it of context.glibPackages) {
    if (andGlobals) {
      globals[it.packageName] = it.globalName
    }
    entries[it.packageName] = it.distDir(it.baseName, 'src', 'index.js')
  }
  return [entries, globals]
}

import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { OutputOptions, RollupOptions } from 'rollup'
// import sourcemaps from 'rollup-plugin-sourcemaps'
import visualizer from 'rollup-plugin-visualizer'
import { GlibPackageContext, project } from '../context'
import { BundleWatchOptions, rollupIgnoreWarnings, rollupOrWatch } from './plugins'
import { build, InlineConfig } from 'vite'

export function bundle(options: { watch?: boolean } = {}) {
  return Promise.all(project.glibPackages.map((pkg) => rollupPackage(pkg, options)))
  // return Promise.all(project.glibPackages.map((pkg) => vitePackage(pkg, options)))
}

async function vitePackage(pkg: GlibPackageContext, options: BundleWatchOptions = {}) {
  const [entries, globals] = resolveAliases(pkg.baseName !== 'gglib')

  return build({
    resolve: {
      extensions: ['.mts', '.ts', '.js', '.json'],
      external: Object.keys(globals),
    },
    build: {
      lib: {
        entry: pkg.tscOutDir('index.js'),
        name: pkg.globalName,
        fileName: (format) => `${pkg.baseName}.${format}.js`,
        formats: ['umd'],
      },
      sourcemap: true,
      outDir: pkg.rollupOutDir(),
    }
  })
}

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
      // sourcemaps(),
      visualizer({
        filename: pkg.distDir('stats.html'),
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

function resolveAliases(andGlobals: boolean) {
  const globals: Record<string, string> = {}
  const entries: Record<string, string> = {}
  for (const it of project.glibPackages) {
    if (andGlobals) {
      globals[it.packageName] = it.globalName
    }
    entries[it.packageName] = it.distDir(it.baseName, 'src', 'index.js')
  }
  return [entries, globals]
}

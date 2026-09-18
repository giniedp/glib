import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { OutputOptions, RollupOptions } from 'rollup'
// import sourcemaps from 'rollup-plugin-sourcemaps'
import { globbySync } from 'globby'
import * as path from 'path'
import visualizer from 'rollup-plugin-visualizer'
import { GlibPackageContext, project } from '../context'
import { BundleWatchOptions, rollupIgnoreWarnings, rollupOrWatch } from './plugins'

export function bundle(options: { watch?: boolean } = {}) {
  return Promise.all([
    ...project.glibPackages.map(async (pkg) => rollupPackage(pkg, options)).flat(),
    ...project.glibPackages.map(async (pkg) => bundleWorkerFiles(pkg, options).flat()),
  ])
}

function bundleWorkerFiles(pkg: GlibPackageContext, options: BundleWatchOptions = {}) {
  const workerFiles = globbySync(pkg.srcDir('**/*.worker.ts'))
  return workerFiles.map((file) => rollupWorker(pkg, file, options))
}

async function rollupWorker(pkg: GlibPackageContext, workerFile: string, options: BundleWatchOptions = {}) {
  const [entries] = resolveAliases(false)
  const relPath = path.relative(pkg.srcDir(), workerFile).replace(/\.ts$/, '.js')
  const outFileName = path.basename(relPath)

  const inputOptions: RollupOptions = {
    input: pkg.tscOutDir(relPath),
    onwarn: rollupIgnoreWarnings(['THIS_IS_UNDEFINED']),
    plugins: [
      nodeResolve(),
      alias({
        entries: entries,
      }),
    ],
  }
  const outputOptions: OutputOptions = {
    format: 'esm',
    sourcemap: true,
    file: pkg.rollupOutDir(outFileName),
    exports: 'named',
  }
  return rollupOrWatch(inputOptions, outputOptions, options)
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
    external: [...Object.keys(globals), 'vite'],
  }
  const outputOptions: OutputOptions = {
    format: 'esm',
    sourcemap: true,
    file: pkg.rollupOutDir(pkg.baseName + '.esm.js'),
    // name: pkg.globalName, // just for logging
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

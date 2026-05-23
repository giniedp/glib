import { glob, stat } from 'node:fs/promises'
import path, { dirname } from 'node:path'
import {
  createLogger,
  createFilter,
  type ModuleNode,
  type PluginOption,
  type ResolvedConfig,
  type ViteDevServer,
} from 'vite'
import { generateMetaFile } from './codegen.js'
import { resolveIncludes } from './preprocess.js'

const WGSL_RE = /\.wgsl$/
const GLSL_RE = /\.glsl$/

const WGSL_TS_RE = /\.wgsl.ts$/
const GLSL_TS_RE = /\.glsl.ts$/

export interface GglibVitePluginOptions {
  /**
   *
   */
  files: string[]
}

export function ggPlugin(options: GglibVitePluginOptions): PluginOption {
  let config: ResolvedConfig
  let server: ViteDevServer
  let filter = createFilter(options.files)
  const logger = createLogger('info', { prefix: '[gglib]' })

  async function resolveShader(file: string) {
    if (!file) {
      return null
    }

    const exists = await stat(file).catch(() => null)
    if (!exists) {
      return null
    }
    const mod = await server.ssrLoadModule(file)
    if (typeof mod?.default !== 'string') {
      return null
    }
    return mod.default
  }

  async function processShader(file: string): Promise<void> {
    const glslFile = file.replace(/\.(wgsl|glsl)\.ts$/, '.glsl.ts')
    const wgslFile = file.replace(/\.(wgsl|glsl)\.ts$/, '.wgsl.ts')
    const metaFile = file.replace(/\.(wgsl|glsl)\.ts$/, '.meta.ts')

    const glslCode = await resolveShader(glslFile)
    const wgslCode = await resolveShader(wgslFile)
    if (!glslCode && !wgslCode) {
      logger.error(`skipped ${file}`, { timestamp: true })
      return
    }
    if (!glslCode) {
      logger.warn(`missing GLSL: ${file}`, { timestamp: true })
    }
    if (!wgslCode) {
      logger.warn(`missing WGSL: ${file}`, { timestamp: true })
    }

    logger.info(`generate for: ${file}...`, { timestamp: true })
    await generateMetaFile({
      glsl: glslCode,
      wgsl: wgslCode,
      metaPath: metaFile,
    }).catch((err) => {
      console.error(`[gglib/vite-plugin] failed to generate shader metadata for ${file}: ${err}`)
    })
  }

  return {
    name: '@gglib/vite-plugin',
    enforce: 'pre' as const,

    configResolved(resolved) {
      config = resolved
    },

    configureServer(srv) {
      server = srv
    },

    async buildStart() {
      if (!server) {
        // build mode
        return
      }

      const root = config.root
      const files: string[] = []
      for (const pattern of options.files) {
        const matches = glob(pattern, { cwd: root })
        for await (const match of matches) {
          const abs = path.resolve(root, match)
          if (WGSL_TS_RE.test(abs) || GLSL_TS_RE.test(abs)) {
            files.push(abs)
          }
        }
      }

      await Promise.all(files.map(processShader))
    },

    async load(id) {
      const isGlsl = GLSL_RE.test(id)
      const isWgsl = WGSL_RE.test(id)
      if (!isGlsl && !isWgsl) {
        return null
      }

      const dir = dirname(id)
      const { source, deps } = await resolveIncludes(id, dir)

      // register all included files as watch dependencies
      for (const dep of deps) {
        this.addWatchFile(dep)
      }

      return source
    },

    async handleHotUpdate({ modules, server }) {
      const toRegenerate = new Set<string>()
      const seen = new Set<ModuleNode>()
      const queue = [...modules]

      while (queue.length) {
        const m = queue.pop()!

        if (seen.has(m)) {
          continue
        }
        seen.add(m)
        server.moduleGraph.invalidateModule(m)

        if (!filter(m.id)) {
          continue
        }

        if (WGSL_TS_RE.test(m.id) || GLSL_TS_RE.test(m.id)) {
          toRegenerate.add(m.id)
        }

        for (const importer of m.importers) {
          queue.push(importer)
        }
      }

      if (!toRegenerate.size) {
        return
      }

      await Promise.all([...toRegenerate].map(processShader))
    },
  }
}

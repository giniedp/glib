import { dirname } from 'node:path'
import type { PluginOption, ResolvedConfig } from 'vite'
import { parseWgsl } from './adapter.js'
import { buildVirtualModule } from './codegen.js'
import { resolveIncludes } from './preprocess.js'

const WGSL_RE = /\.wgsl$/

export function ggPlugin(): PluginOption {
  let config: ResolvedConfig

  return {
    name: '@gglib/vite-plugin',
    enforce: 'pre' as const,

    configResolved(resolved) {
      config = resolved
    },

    async load(id) {
      if (!WGSL_RE.test(id)) return null

      const dir = dirname(id)
      const { source, deps } = await resolveIncludes(id, dir)

      // register all included files as watch dependencies
      for (const dep of deps) {
        this.addWatchFile(dep)
      }

      const program = parseWgsl(source)
      const code = buildVirtualModule(source, program)

      return { code }
    },
  }
}

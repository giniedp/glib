import { createFilter } from 'rollup-pluginutils'
import { createInstrumenter } from 'istanbul-lib-instrument'
import { TransformPluginContext } from 'rollup'

export  function rollupIstanbulInstrumenter (options: any = {}) {
  const filter = createFilter(options.include, options.exclude)
  const instrumenter = createInstrumenter({
    produceSourceMap: true,
    esModules: true,
  })

  return {
    name: 'istanbul',
    transform(this: TransformPluginContext, code: string, id: string) {
      if (!filter(id)) return
      const { version, sources, sourcesContent, names, mappings } = this.getCombinedSourcemap()
      code = instrumenter.instrumentSync(code, id, {
        version: String(version),
        sources,
        sourcesContent,
        names,
        mappings,
      })
      return { code, map: instrumenter.lastSourceMap() }
    },
  }
}

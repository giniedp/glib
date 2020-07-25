import { DataUri, Log, Uri } from '@gglib/utils'

import { ContentType } from './ContentType'
import { LoaderEntry, LoaderSpec, LoaderInput, LoaderOutput } from './Loader'
import { PipelineContext } from './PipelineContext'

interface Node {
  entry: LoaderEntry
  next: Node[]
}

function describeSym(sym: any) {
  if (!sym) {
    return `${sym}`
  }
  if (sym['name']) {
    return sym['name']
  }
  return sym.toString()
}

function info(msg: string) {
  Log.d('[Content.Loader] ' + msg)
}

function warn(msg: string) {
  Log.w('[Content.Loader] ' + msg)
}

let defaultPipeline: Pipeline

/**
 * @public
 */
export class Pipeline {
  /**
   * Returns the default pipeline instance
   */
  public static get default() {
    if (defaultPipeline == null) {
      defaultPipeline = new Pipeline()
    }
    return defaultPipeline
  }

  private loaders: LoaderEntry[] = []

  public static async run(context: PipelineContext) {
    return context.pipeline.run(context.source, context.target, null, context)
  }

  /**
   * Registeres a loader function
   *
   * @param loader - The loader specification
   */
  public register(loader: LoaderSpec) {
    const inputs = Array.isArray(loader.input) ? loader.input : [loader.input]
    inputs.forEach((input) => {
      for (const entry of this.loaders) {
        if (entry.handle === loader.handle && entry.input === input && entry.output === loader.output) {
          warn(`same loader was registered twice... loader is skipped. ${entry.toString()}`)
          return
        }
      }
      this.loaders.push(new LoaderEntry(input, loader.output, loader.handle))
    })
  }

  /**
   *
   * @param source - The source type or symbol identifying the input type
   * @param target - The target type or symbol identifying the target type
   * @param input - The input value to import. Its type is identified by `source`
   * @param context - The context use during the import
   */
  public async run(source: LoaderInput, target: LoaderOutput, input: any, context: PipelineContext) {

    if (typeof source === 'string') {
      if (DataUri.isDataUri(source)) {
        source = ContentType.parse(DataUri.parse(source).contentType).mimeType
      } else {
        source = Uri.ext(source)
      }
    }

    const pipeline = this.resolve(source, target)
    if (pipeline.length === 0) {
      throw new Error(`Loader is missing: ${describeSym(source)} => ${describeSym(target)}`)
    }

    return this.walk(pipeline, input, context)
  }

  /**
   * Detects whether there is a loding path from `source` type to the `target` type
   *
   * @param source - The source type or symbol identifying the input type
   * @param target - The target type or symbol identifying the target type
   */
  public canLoad(source: LoaderInput, target: LoaderOutput): boolean {
    return this.resolve(source, target).length > 0
  }

  private resolve(
    source: LoaderInput,
    target: LoaderOutput,
    exclude: LoaderEntry[] = [],
  ): Node[] {
    const candidates = this.loaders.filter((it) => exclude.indexOf(it) === -1 && it.input === source)
    exclude.push(...candidates)
    return candidates.map((it) => {
      if (it.output === target) {
        return {
          entry: it,
          next: [],
        }
      }
      const next = this.resolve(it.output, target, exclude)
      return next && next.length ? {
        entry: it,
        next: next,
      } : null
    })
    .filter((it) => it != null)
    .sort((a, b) => a.next.length <= b.next.length ? -1 : 1)
  }

  private async walk<T>(nodes: Node[], input: any, context: PipelineContext<T>, stage: number = 1) {
    if (nodes.length === 0) {
      // finish recursion
      return input
    }
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      context.pipeline = this
      info(`load stage:${stage} attempt:${i + 1}: ${describeSym(node.entry.input)} => ${describeSym(node.entry.output)}`)
      const loaded = await node.entry.handle(input, context)
      const result: T = await this.walk(node.next, loaded, context, stage + 1)
      if (result) {
        return result
      }
    }
    return null
  }
}

// tslint:disable ban-types
import { DataUri, Log, Uri } from '@gglib/core'
import { ContentType } from './ContentType'
import { Manager, RawAsset } from './Manager'
import { Parser } from './parser'

export type PipelineStage = 'preload'|'load'|'import'|'preprocess'|'process'|'postprocess'

/**
 * @public
 */
export interface PipelineContext {
  /**
   * The current processing content manager
   */
  manager: Manager
  /**
   * The current processing content pipeline
   */
  pipeline: Pipeline
  /**
   * The name of the current processing stage
   */
  stage: PipelineStage
  /**
   * The extension name or the mime type of the source file that is being loaded
   */
  sourceType: string
  /**
   * The type name of the asset that is being loaded
   */
  targetType: PipelineTargetType
  /**
   * Any user defined options that might be used during the pipeline
   */
  options: any

  /**
   * The full path or url that is being loaded
   */
  source?: string
  /**
   * The raw asset that has been downloaded during the load stage
   */
  downloaded?: RawAsset
  /**
   * Intermadiate result of the import stage
   */
  imported?: any
  /**
   * The final result of the process stage
   */
  result?: any
}

export type PipelineHandler = (context: PipelineContext) => Promise<void>|void

export type PipelineTargetType = string|Function

/**
 * @public
 */
export interface PipelineEntry {
  stage: PipelineStage
  sourceType: string
  targetType: PipelineTargetType
  handler: PipelineHandler
}

/**
 * @internal
 */
export function describeSourceType(sourcetype: string) {
  return String(sourcetype)
}

/**
 * @internal
 */
export function describeTargetType(targetType: PipelineTargetType) {
  return typeof targetType === 'string' ? targetType : targetType.name
}

/**
 * @internal
 */
export function describeContext(context: PipelineContext): string {
  return [
    `stage: '${context.stage}'`,
    `sourceType: '${describeSourceType(context.sourceType)}'`,
    `targetType: '${describeTargetType(context.targetType)}'`,
  ].join(', ')
}

const handlers: PipelineEntry[] = []

function addHandler(
  stage: PipelineStage,
  sourceType: string|string[],
  targetType: PipelineTargetType|PipelineTargetType[],
  handler: PipelineHandler,
) {
  if (!Array.isArray(sourceType)) { sourceType = [sourceType] }
  if (!Array.isArray(targetType)) { targetType = [targetType] }
  for (let st of sourceType) {
    for (let tt of targetType) {
      handlers.unshift({
        stage: stage,
        sourceType: st,
        targetType: tt,
        handler: handler,
      })
    }
  }
}

function addTransformHandler(
  stage: PipelineStage,
  targetType: PipelineTargetType|PipelineTargetType[],
  handler: PipelineHandler,
) {
  if (!Array.isArray(targetType)) { targetType = [targetType] }
  for (let tt of targetType) {
    handlers.unshift({
      stage: stage,
      sourceType: '*', // explicitely match all source types
      targetType: tt,
      handler: handler,
    })
  }
}

/**
 * Registeres a content loader function
 *
 * @public
 */
export function pipelineLoader(
  sourceType: string|string[],
  targetType: PipelineTargetType|PipelineTargetType[],
  handler: PipelineHandler,
) {
  addHandler('load', sourceType, targetType, handler)
}

/**
 * Registeres a content importer function
 *
 * @public
 */
export function pipelineImporter(
  sourceType: string|string[],
  targetType: PipelineTargetType|PipelineTargetType[],
  handler: PipelineHandler,
) {
  addHandler('import', sourceType, targetType, handler)
}

/**
 * Registeres a content preloader function
 *
 * @public
 */
export function pipelinePreloader(
  targetType: PipelineTargetType|PipelineTargetType[],
  handler: PipelineHandler,
) {
  addTransformHandler('preload', targetType, handler)
}

/**
 * Registeres a content processor function
 *
 * @public
 */
export function pipelineProcessor(
  targetType: PipelineTargetType|PipelineTargetType[],
  handler: PipelineHandler,
) {
  addTransformHandler('process', targetType, handler)
}

/**
 * Registeres a content preprocessor function
 *
 * @public
 */
export function pipelinePreprocessor(
  targetType: PipelineTargetType|PipelineTargetType[],
  handler: PipelineHandler,
) {
  addTransformHandler('preprocess', targetType, handler)
}

/**
 * Registeres a content postprocessor function
 *
 * @public
 */
export function pipelinePostprocessor(
  targetType: PipelineTargetType|PipelineTargetType[],
  handler: PipelineHandler,
) {
  addTransformHandler('postprocess', targetType, handler)
}

/**
 * @public
 */
export class Pipeline {

  public matchSourceType(wanted: string, entry: PipelineEntry): boolean {
    if (entry.sourceType === '*') {
      // global match
      return true
    }
    if (entry.sourceType === wanted) {
      // matches extension or mime type
      return true
    }

    const ect = ContentType.parse(entry.sourceType)
    const wct = ContentType.parse(wanted)

    if (!ect && !wct) {
      return false
    }
    if (ect.mediaType !== wct.mediaType) {
      return false
    }
    if (ect.subType === '*') {
      return true
    }
    return false
  }

  public matchTargetType(wanted: PipelineTargetType, item: PipelineEntry): boolean {
    const current = item.targetType
    if (current === '*' || current === wanted) {
      return true
    }
    if (typeof current === 'string' && typeof wanted === 'function') {
      return wanted.name === current
    }
    if (typeof wanted === 'string' && typeof current === 'function') {
      return current['name'] === wanted // TODO: check
    }
    return false
  }

  public findHandler(stage: PipelineStage, sourceType: string, targetType: PipelineTargetType): PipelineHandler {
    for (let item of handlers) {
      if (item.stage !== stage) { continue }
      if (!this.matchTargetType(targetType, item)) { continue }
      if (this.matchSourceType(sourceType, item)) {
        return item.handler
      }
    }
    return null
  }

  public findAllHandler(
    stage: PipelineStage,
    sourceType: string,
    targetType: PipelineTargetType,
    out: PipelineHandler[] = [],
  ): PipelineHandler[] {
    for (let item of handlers) {
      if (item.stage !== stage) { continue }
      if (!this.matchTargetType(targetType, item)) { continue }
      if (this.matchSourceType(sourceType, item)) {
        out.push(item.handler)
      }
    }
    return out
  }

  public runHandlers(stage: PipelineStage, context: PipelineContext): Promise<void> {
    context.stage = stage
    const h = this.findAllHandler(context.stage, null, context.targetType)
    return Promise.all(h.map((it: any)  => it(context))).then(() => undefined)
  }

  public load(context: PipelineContext): Promise<void> {
    return this.runHandlers('preload', context)
      .then(() => {
        context.stage = 'load'
        const handler = this.findHandler(context.stage, context.sourceType, context.targetType)
        return handler
          ? Promise.resolve(handler(context))
          : Promise.reject(`[Content.Manager] loader not found: ${describeContext(context)}`)
      })
      .then(() => context.result)
  }

  public import(context: PipelineContext): Promise<void> {
    context.stage = 'import'
    const handler = this.findHandler(context.stage, context.sourceType, context.targetType)
    return handler
      ? Promise.resolve(handler(context))
      : Promise.reject(`[Content.Manager] importer not found: ${describeContext(context)}`)
  }

  public process(context: PipelineContext): Promise<void> {
    return this.runHandlers('preprocess', context)
    .then(() => {
      context.stage = 'process'
      const handler = this.findHandler(context.stage, null, context.targetType)
      return handler
        ? Promise.resolve(handler(context))
        : Promise.reject(`[Content.Manager] processor not found: { ${describeContext(context)} }`)
    })
    .then(() => this.runHandlers('postprocess', context))
  }
}

pipelineLoader('*', '*', (context: PipelineContext) => {
  return context.manager.download(context.source).then((result) => {
    context.downloaded = result
    context.sourceType = context.sourceType || result.contentType.mimeType
    return context.pipeline.import(context)
  })
})

pipelineImporter(['.json', 'application/json'], '*', (context: PipelineContext) => {
  context.imported = Parser.JSON.parse(context.downloaded.content)
  return context.pipeline.process(context)
})

pipelineImporter(['.yml', 'application/x-yaml'], '*', (context: PipelineContext) => {
  context.imported = Parser.YML.parse(context.downloaded.content)
  return context.pipeline.process(context)
})

pipelineImporter(['.mtl', 'application/x-mtl'], '*', (context: PipelineContext) => {
  context.imported = Parser.MTL.parse(context.downloaded.content)
  return context.pipeline.process(context)
})

pipelineImporter(['.obj', 'application/x-obj'], '*', (context: PipelineContext) => {
  context.imported = Parser.OBJ.parse(context.downloaded.content)
  return context.pipeline.process(context)
})

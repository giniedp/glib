import { path } from '@glib/core'
import { Manager, RawAsset } from './Manager'
import * as Parser from './parser'

export type PipelineStage = 'preload'|'load'|'import'|'preprocess'|'process'|'postprocess'

export interface PipelineContext {
  manager: Manager
  pipeline: Pipeline
  stage: PipelineStage
  sourceType: string
  targetType: string
  options: any

  path?: string
  raw?: RawAsset
  intermediate?: any
  result?: any
}

export type PipelineHandler = (context: PipelineContext) => Promise<void>|void

export interface PipelineEntry {
  stage: PipelineStage
  sourceType: string
  targetType: string
  handler: PipelineHandler
}

function describeContext(context: PipelineContext): string {
  return [
    `stage: '${context.stage}'`,
    `sourceType: '${context.sourceType}'`,
    `targetType: '${context.targetType}'`,
  ].join(', ')
}

const handlers: PipelineEntry[] = []

function defaultLoader(context: PipelineContext): Promise<void> {
  return context.manager.download(context.path).then((result) => {
    context.raw = result
    return context.pipeline.import(context)
  })
}

function defaultImporter(context: PipelineContext): Promise<void> {
  let ext = path.ext(context.path)
  if (context.sourceType === '.json') {
    context.intermediate = Parser.JSON.parse(context.raw.content)
  } else if (context.sourceType === '.yml') {
    context.intermediate = Parser.YML.parse(context.raw.content)
  } else if (context.sourceType === '.mtl') {
    context.intermediate = Parser.MTL.parse(context.raw.content)
  } else if (context.sourceType === '.obj') {
    context.intermediate = Parser.OBJ.parse(context.raw.content)
  } else {
    return Promise.reject(`[Content.Manager] parser not found: { ${describeContext(context)} }`)
  }
  return context.pipeline.process(context)
}

/**
 * Registeres a content preloader function
 */
export function pipelinePreloader(targetType: string, handler: PipelineHandler) {
  handlers.push({
    stage: 'preload',
    sourceType: null,
    targetType: targetType,
    handler: handler,
  })
}

/**
 * Registeres a content loader function
 */
export function pipelineLoader(sourceType: string|string[], targetType: string, handler: PipelineHandler) {
  let type: any = sourceType
  if (!Array.isArray(type)) { type = [type] }
  for (let name of type) {
    handlers.push({
      stage: 'load',
      sourceType: name,
      targetType: targetType,
      handler: handler,
    })
  }
}

/**
 * Registeres a content importer function
 */
export function pipelineImporter(sourceType: string|string[], targetType: string, handler: PipelineHandler) {
  let type: any = sourceType
  if (!Array.isArray(type)) { type = [type] }
  for (let name of type) {
    handlers.push({
      stage: 'import',
      sourceType: name,
      targetType: targetType,
      handler: handler,
    })
  }
}

/**
 * Registeres a content processor function
 */
export function pipelineProcessor(targetType: string, handler: PipelineHandler) {
  handlers.push({
    stage: 'process',
    sourceType: null,
    targetType: targetType,
    handler: handler,
  })
}

/**
 * Registeres a content preprocessor function
 */
export function pipelinePreProcessor(targetType: string, handler: PipelineHandler) {
  handlers.push({
    stage: 'preprocess',
    sourceType: null,
    targetType: targetType,
    handler: handler,
  })
}

/**
 * Registeres a content postprocessor function
 */
export function pipelinePostProcessor(targetType: string, handler: PipelineHandler) {
  handlers.push({
    stage: 'postprocess',
    sourceType: null,
    targetType: targetType,
    handler: handler,
  })
}

export class Pipeline {

  public findHandler(stage: PipelineStage, sourceType: string, targetType: string): PipelineHandler {
    for (let item of handlers) {
      if (item.stage !== stage) { continue }
      if (item.targetType !== targetType) { continue }
      if (item.sourceType === sourceType || item.sourceType === '*') {
        return item.handler
      }
    }
    return null
  }

  public findAllHandler(stage: PipelineStage, sourceType: string, targetType: string, out: PipelineHandler[] = []): PipelineHandler[] {
    for (let item of handlers) {
      if (item.stage !== stage) { continue }
      if (item.targetType !== targetType) { continue }
      if (item.sourceType === sourceType || item.sourceType === '*') {
        out.push(item.handler)
      }
    }
    return out
  }

  public runHandlers(stage: PipelineStage, context: PipelineContext): Promise<void> {
    context.stage = stage
    const h = this.findAllHandler(context.stage, null, context.targetType)
    return Promise.all(h.map((it: any)  => it(context))).then(() => null)
  }

  public load(context: PipelineContext): Promise<void> {
    return this.runHandlers('preload', context)
      .then(() => {
        context.stage = 'load'
        const handler = this.findHandler(context.stage, context.sourceType, context.targetType) || defaultLoader
        return Promise.resolve(handler(context))
      })
      .then(() => context.result)
  }

  public import(context: PipelineContext): Promise<void> {
    context.stage = 'import'
    const handler = this.findHandler(context.stage, context.sourceType, context.targetType) || defaultImporter
    return Promise.resolve(handler(context))
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

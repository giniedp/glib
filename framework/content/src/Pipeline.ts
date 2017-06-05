import { path } from '@glib/core'
import { Manager, RawAsset } from './Manager'

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

const handlers: PipelineEntry[] = []

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

  public import(context: PipelineContext): Promise<void> {
    context.stage = 'import'
    const handler = this.findHandler(context.stage, context.sourceType, context.targetType)
    return handler
      ? Promise.resolve(handler(context))
      : Promise.reject(`[Content.Manager] importer not found for sourceType:'${context.sourceType}' targetType:'${context.targetType}'`)
  }

  public process(context: PipelineContext): Promise<void> {
    return this.runHandlers('preprocess', context)
    .then(() => {
      context.stage = 'process'
      const handler = this.findHandler(context.stage, context.sourceType, context.targetType)
      return handler
        ? Promise.resolve(handler(context))
        : Promise.reject(`[Content.Manager] processor not found for targetType:'${context.targetType}'`)
    })
    .then(() => this.runHandlers('postprocess', context))
  }

  public load(context: PipelineContext): Promise<void> {
    return this.runHandlers('preload', context)
      .then(() => {
        const handler = this.findHandler(context.stage, context.sourceType, context.targetType)
        return handler
          ? Promise.resolve(handler(context))
          : Promise.reject(`[Content.Manager] loader not found for sourceType:'${context.sourceType}' targetType:'${context.targetType}'`)
      })
      .then(() => context.result)
  }
}

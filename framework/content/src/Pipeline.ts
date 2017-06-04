import { path } from '@glib/core'
import { Manager, RawAsset } from './Manager'
import { JSON } from './parser/JSON'
import { MTL } from './parser/MTL'
import { OBJ } from './parser/OBJ'
import { YML } from './parser/YML'

export interface Context {
  manager: Manager
  stage: 'preload'|'load'|'import'|'preprocess'|'process'|'postprocess'
  sourceType: string
  targetType: string
  options: any

  path?: string
  raw?: RawAsset
  intermediate?: any
  result?: any
}

export type StageHandler = (context: Context) => Promise<void>|void

export interface StageHandlerEntry {
  stage: 'preload'|'load'|'import'|'preprocess'|'process'|'postprocess'
  sourceType: string
  targetType: string
  handler: StageHandler
}

/**
 *
 */
export let handlers: StageHandlerEntry[] = []

export function defaultLoader(context: Context): Promise<void> {
  return context.manager.download(context.path).then((result) => {
    context.raw = result
    return context.manager.import(context)
  })
}

export function defaultImporter(context: Context): Promise<void> {
  let ext = path.ext(context.path)
  if (context.sourceType === '.json') {
    context.intermediate = JSON.parse(context.raw.content)
  } else if (context.sourceType === '.yml') {
    context.intermediate = YML.parse(context.raw.content)
  } else if (context.sourceType === '.mtl') {
    context.intermediate = MTL.parse(context.raw.content)
  } else if (context.sourceType === '.obj') {
    context.intermediate = OBJ.parse(context.raw.content)
  } else {
    return Promise.reject('no parser found')
  }
  return context.manager.process(context)
}

/**
 * Registeres a content preloader function
 */
export function preloader(targetType: string, handler: StageHandler) {
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
export function loader(sourceType: string|string[], targetType: string, handler: StageHandler) {
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
export function importer(sourceType: string|string[], targetType: string, handler: StageHandler) {
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
export function processor(targetType: string, handler: StageHandler) {
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
export function preprocessor(targetType: string, handler: StageHandler) {
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
export function postprocessor(targetType: string, handler: StageHandler) {
  handlers.push({
    stage: 'postprocess',
    sourceType: null,
    targetType: targetType,
    handler: handler,
  })
}

export function getHandlers(stage: string, sourceType: string, targetType: string, out: StageHandler[]= []): StageHandler[] {
  for (let item of handlers) {
    if (item.stage !== stage) { continue }
    if (item.targetType !== targetType) { continue }
    if (item.sourceType === sourceType || item.sourceType === '*') {
      out.push(item.handler)
    }
  }
  return out
}

let queryArray: StageHandler[] = []
export function getLoader(sourceType: string, targetType: string): StageHandler {
  queryArray.length = 0
  getHandlers('load', sourceType, targetType, queryArray)
  queryArray.push(defaultLoader)
  return queryArray[0]
}
export function getImporter(sourceType: string, targetType: string): StageHandler {
  queryArray.length = 0
  getHandlers('import', sourceType, targetType, queryArray)
  queryArray.push(defaultImporter)
  return queryArray[0]
}
export function getProcessor(targetType: string): StageHandler {
  queryArray.length = 0
  return getHandlers('process', null, targetType, queryArray)[0]
}

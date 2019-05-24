import { Entity } from './Entity'

export interface TemplateOptions {
  [k: string]: any,
}

export type TemplateFunction = (entity: Entity, options?: TemplateOptions) => void

export interface TemplateMap {
  [k: string]: any
}

const templates: { [key: string]: TemplateFunction } = {}

/**
 * @public
 */
export function addTemplate(name: string, template: TemplateFunction) {
  if (templates[name]) {
    throw new Error(`Template '${name}' is already registered`)
  }
  templates[name] = template
}

/**
 * @public
 */
export function getTemplate(name: string) {
  return templates[name]
}

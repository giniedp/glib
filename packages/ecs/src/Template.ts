import { Entity } from './Entity'

export type Template = (entity: Entity, options?: any) => void

const templates: { [key: string]: Template } = {}

export function addTemplate(name: string, builder: Template) {
  if (templates[name]) {
    throw new Error(`Template '${name}' is already registered`)
  }
  templates[name] = builder
}

export function getTemplate(name: string) {
  return templates[name]
}

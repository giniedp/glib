import { Device } from '@glib/graphics'
import * as Components from './components'
import { Entity } from './Entity'

export type Template = (entity: Entity, options?: any) => void

const registry: { [key: string]: Template } = {}

export function registerTemplate(name: string, builder: Template) {
  if (registry[name]) {
    throw new Error(`Template '${name}' is already registered`)
  }
  registry[name] = builder
}

export function getTemplate(name: string) {
  return registry[name]
}

registerTemplate('Game', (entity: Entity, options: any= {}) => {
  entity
    .addService('Device', new Device({ canvas: options.canvas }))
    .addComponent(new Components.GameLoop())
    .addComponent(new Components.Time())
    .addComponent(new Components.Fps())
    .addComponent(new Components.Assets())
    .addComponent(new Components.Renderer())
    .applyTemplates(options.templates || {})
  if (options.autorun !== false) {
    entity.getService('GameLoop').run()
  }
})

export function createGame(options: any, ...templates: string[]) {
  return new Entity().applyTemplate('Game', options).applyTemplates(templates)
}

registerTemplate('Transform', (entity: Entity) => {
  if (!entity.s.Transform) {
    entity.addComponent(new Components.Transform())
  }
})

registerTemplate('Camera', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Camera) {
    entity.addComponent(new Components.Camera(options))
  }
})

registerTemplate('DirectionalLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Directional
    entity.addComponent(new Components.Light(options))
  }
})

registerTemplate('PointLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Point
    entity.addComponent(new Components.Light(options))
  }
})

registerTemplate('SpotLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Spot
    entity.addComponent(new Components.Light(options))
  }
})

registerTemplate('Light', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Light) {
    entity.addComponent(new Components.Light(options))
  }
})

registerTemplate('Model', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Renderable) {
    entity.addComponent(new Components.Model(options))
  }
})

registerTemplate('Mouse', (entity: Entity, options: any = {}) => {
  if (!entity.s.Mouse) {
    entity.addComponent(new Components.Mouse(options))
  }
})

registerTemplate('Keyboard', (entity: Entity, options: any = {}) => {
  if (!entity.s.Keyboard) {
    entity.addComponent(new Components.Keyboard(options))
  }
})

registerTemplate('WASD', (entity: Entity, options: any = {}) => {
  entity.root.applyTemplate('Mouse')
  entity.root.applyTemplate('Keyboard')
  entity.addComponent(new Components.WASD())
})

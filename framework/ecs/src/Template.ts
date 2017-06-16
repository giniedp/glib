import { ContextAttributes, Device } from '@glib/graphics'
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

registerTemplate('Game', (
  entity: Entity,
  options: {
    canvas?: HTMLCanvasElement,
    context?: string | WebGLRenderingContext | WebGL2RenderingContext,
    contextAttributes?: ContextAttributes,
    templates?: Array<string|Template>,
    autorun?: boolean,
  } = {},
) => {
  entity
    .addService('Device', new Device({
      canvas: options.canvas,
      context: options.context,
      contextAttributes: options.contextAttributes,
    }))
    .addComponent(new Components.GameLoopComponent())
    .addComponent(new Components.TimeComponent())
    .addComponent(new Components.FpsComponent())
    .addComponent(new Components.AssetsComponent())
    .addComponent(new Components.RendererComponent())
  if (options.templates) {
    entity.applyTemplates(options.templates)
  }
  if (options.autorun !== false) {
    entity.getService('GameLoop').run()
  }
})

export function createGame(options: any, ...templates: string[]) {
  return new Entity().applyTemplate('Game', options).applyTemplates(templates)
}

registerTemplate('Transform', (entity: Entity) => {
  if (!entity.s.Transform) {
    entity.addComponent(new Components.TransformComponent())
  }
})

registerTemplate('Camera', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Camera) {
    entity.addComponent(new Components.CameraComponent(options))
  }
})

registerTemplate('DirectionalLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Directional
    entity.addComponent(new Components.LightComponent(options))
  }
})

registerTemplate('PointLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Point
    entity.addComponent(new Components.LightComponent(options))
  }
})

registerTemplate('SpotLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Spot
    entity.addComponent(new Components.LightComponent(options))
  }
})

registerTemplate('Light', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Light) {
    entity.addComponent(new Components.LightComponent(options))
  }
})

registerTemplate('Model', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Renderable) {
    entity.addComponent(new Components.ModelComponent(options))
  }
})

registerTemplate('Mouse', (entity: Entity, options: any = {}) => {
  if (!entity.s.Mouse) {
    entity.addComponent(new Components.MouseComponent(options))
  }
})

registerTemplate('Keyboard', (entity: Entity, options: any = {}) => {
  if (!entity.s.Keyboard) {
    entity.addComponent(new Components.KeyboardComponent(options))
  }
})

registerTemplate('WASD', (entity: Entity, options: any = {}) => {
  entity.root.applyTemplate('Mouse')
  entity.root.applyTemplate('Keyboard')
  entity.addComponent(new Components.WASDComponent())
})

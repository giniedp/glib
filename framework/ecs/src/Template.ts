import { ContextAttributes, Device } from '@glib/graphics'
import * as Components from './components'
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

addTemplate('Game', (
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

export function createGame(options: any, ...tpl: string[]) {
  return new Entity().applyTemplate('Game', options).applyTemplates(tpl)
}

addTemplate('Transform', (entity: Entity) => {
  if (!entity.s.Transform) {
    entity.addComponent(new Components.TransformComponent())
  }
})

addTemplate('Camera', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Camera) {
    entity.addComponent(new Components.CameraComponent(options))
  }
})

addTemplate('DirectionalLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Directional
    entity.addComponent(new Components.LightComponent(options))
  }
})

addTemplate('PointLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Point
    entity.addComponent(new Components.LightComponent(options))
  }
})

addTemplate('SpotLight', (entity: Entity, options: any = {}) => {
  if (!entity.s.Light) {
    options = options || {}
    options.type = Components.LightType.Spot
    entity.addComponent(new Components.LightComponent(options))
  }
})

addTemplate('Light', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Light) {
    entity.addComponent(new Components.LightComponent(options))
  }
})

addTemplate('Model', (entity: Entity, options: any = {}) => {
  entity.applyTemplate('Transform')
  if (!entity.s.Renderable) {
    entity.addComponent(new Components.ModelComponent(options))
  }
})

addTemplate('Mouse', (entity: Entity, options: any = {}) => {
  if (!entity.s.Mouse) {
    entity.addComponent(new Components.MouseComponent(options))
  }
})

addTemplate('Keyboard', (entity: Entity, options: any = {}) => {
  if (!entity.s.Keyboard) {
    entity.addComponent(new Components.KeyboardComponent(options))
  }
})

addTemplate('WASD', (entity: Entity, options: any = {}) => {
  entity.root.applyTemplate('Mouse')
  entity.root.applyTemplate('Keyboard')
  entity.applyTemplate('Transform')
  entity.addComponent(new Components.WASDComponent())
})

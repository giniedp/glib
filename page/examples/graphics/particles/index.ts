import { BlendState, CullState, DepthState, Device, ParticleChannel } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const settings = {
  texture: device.createTexture({ data: '/assets/textures/particles/star_2.png' }),
  duration: 2000,
  maxParticles: 100,
  minHorizontalVelocity: 0,
  maxHorizontalVelocity: 0.1,
  minVerticalVelocity: 0,
  maxVerticalVelocity: 0.1,
  endVelocity: 0,
  minRotateSpeed: -Math.PI / 1000,
  maxRotateSpeed: Math.PI / 1000,
  minStartSize: 40,
  maxStartSize: 60,
  minEndSize: 80,
  maxEndSize: 100,
  gravity: { x: 0, y: -0.1, z: 0 },
}

const channel = new ParticleChannel(device, settings)

TweakUi.build('#tweak-ui', (q) => {
  let onChange = () => {
    channel.setup(settings)
  }

  q.slider(settings, 'minHorizontalVelocity', { min: 0, max: 1, step: 0.01, onInput: onChange })
  q.slider(settings, 'maxHorizontalVelocity', { min: 0, max: 1, step: 0.01, onInput: onChange })
  q.slider(settings, 'minVerticalVelocity', { min: 0, max: 1, step: 0.01, onInput: onChange })
  q.slider(settings, 'maxVerticalVelocity', { min: 0, max: 1, step: 0.01, onInput: onChange })
  q.slider(settings, 'endVelocity', { min: 0, max: 1, step: 0.01, onInput: onChange })
  q.slider(settings, 'minRotateSpeed', { min: 0, max: -Math.PI, step: 0.01, onInput: onChange })
  q.slider(settings, 'maxRotateSpeed', { min: 0, max: Math.PI, step: 0.01, onInput: onChange })
  q.slider(settings, 'minStartSize', { min: 0.25, max: 100, step: 0.25, onInput: onChange })
  q.slider(settings, 'maxStartSize', { min: 0.25, max: 100, step: 0.25, onInput: onChange })
  q.slider(settings, 'minEndSize', { min: 0.25, max: 100, step: 0.25, onInput: onChange })
  q.slider(settings, 'maxEndSize', { min: 0.25, max: 100, step: 0.25, onInput: onChange })
  q.slider(settings.gravity, 'x', { min: -1, max: 1, step: 0.01, onInput: onChange })
  q.slider(settings.gravity, 'y', { min: -1, max: 1, step: 0.01, onInput: onChange })
  q.slider(settings.gravity, 'z', { min: -1, max: 1, step: 0.01, onInput: onChange })
})

let view = Mat4.createIdentity()
let projection = Mat4.createIdentity()
let rate = 1000 / 30
let gameTime = 0
// Begin the rendering loop
loop((time, dt) => {
  gameTime += dt

  // Resize and clear the screen
  device.resize()
  device.clear(0xff2e2620, 1, 1)
  device.cullState = CullState.CullNone
  device.depthState = DepthState.Default
  device.blendState = BlendState.Additive

  let aspect = device.context.drawingBufferWidth / device.context.drawingBufferHeight
  view.initTranslation(0, 0, -100)
  projection.initPerspectiveFieldOfView(Math.PI / 3, aspect, 0, 200)

  while (gameTime > rate) {
    channel.emit({ x: 0, y: 0, z: 0}, { x: 0, y: 0.02, z: 0})
    gameTime -= rate
  }

  channel.program.setUniform('view', view)
  channel.program.setUniform('projection', projection)
  channel.update(dt)
  channel.draw()
})

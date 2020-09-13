import { BlendState, CullState, DepthState, createDevice } from '@gglib/graphics'
import { ParticleChannel } from '@gglib/particles'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

const channel = new ParticleChannel(device, {
  texture: device.createTexture({ source: '/assets/textures/particles/star_1.png' }),
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
})

TweakUi.build('#tweak-ui', (q) => {
  q.slider(channel.settings, 'minHorizontalVelocity', { min: 0, max: 1, step: 0.01 })
  q.slider(channel.settings, 'maxHorizontalVelocity', { min: 0, max: 1, step: 0.01 })
  q.slider(channel.settings, 'minVerticalVelocity', { min: 0, max: 1, step: 0.01 })
  q.slider(channel.settings, 'maxVerticalVelocity', { min: 0, max: 1, step: 0.01 })
  q.slider(channel.settings, 'endVelocity', { min: 0, max: 1, step: 0.01 })
  q.slider(channel.settings, 'minRotateSpeed', { min: -0.2, max: 0.2, step: 0.0001 })
  q.slider(channel.settings, 'maxRotateSpeed', { min: -0.2, max: 0.2, step: 0.0001 })
  q.slider(channel.settings, 'minStartSize', { min: 0.25, max: 100, step: 0.25 })
  q.slider(channel.settings, 'maxStartSize', { min: 0.25, max: 100, step: 0.25 })
  q.slider(channel.settings, 'minEndSize', { min: 0.25, max: 100, step: 0.25 })
  q.slider(channel.settings, 'maxEndSize', { min: 0.25, max: 100, step: 0.25 })
  q.color(channel.settings, 'minColor', { format: '[n]rgba' })
  q.color(channel.settings, 'maxColor', { format: '[n]rgba' })
  q.slider(channel.settings.gravity, 'x', { min: -1, max: 1, step: 0.01 })
  q.slider(channel.settings.gravity, 'y', { min: -1, max: 1, step: 0.01 })
  q.slider(channel.settings.gravity, 'z', { min: -1, max: 1, step: 0.01 })
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
  device.depthState = DepthState.DepthRead
  device.blendState = BlendState.AlphaBlend

  view.initTranslation(0, 0, -100)
  projection.initPerspectiveFieldOfView(Math.PI / 3, device.drawingBufferAspectRatio, 0.001, 200)

  while (gameTime > rate) {
    channel.emit({ x: 0, y: 0, z: 0}, { x: 0, y: 0.02, z: 0})
    gameTime -= rate
  }

  channel.effect.parameters.view.initFrom(view)
  channel.effect.parameters.projection.initFrom(projection)
  channel.update(dt)
  channel.draw()
})

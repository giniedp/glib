import { IBLSamplerEffect } from '@gglib/effects'
import {
  DepthState,
  Device,
  SamplerState,
  createDevice,
  cubeGeometry,
  skyboxProgram,
  textureSourceFromImageUrl,
} from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device: Device = createDevice({
    canvas,
  })

  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const world = Mat4.createIdentity()
  const camera = demoCamera()
  const skyProgram = skyboxProgram(device)
  const geometry = cubeGeometry(device, {})

  const panoramaUrl = 'https://playground.babylonjs.com/textures/GatonaParkWalkway1_Panorama_4Kx2K.jpg'
  const panoramaTexture = device.createTexture({
    type: 'Texture2D',
    source: textureSourceFromImageUrl(panoramaUrl, 'anonymous'),
    sampler: SamplerState.LinearWrap,
    generateMipmap: true,
  })

  const cubeMap = device.createTexture({
    type: 'TextureCube',
    width: 512,
    height: 512,
    sampler: SamplerState.LinearClamp,
    generateMipmap: true,
  })

  const iblSampler = new IBLSamplerEffect(device, {})
  const stats = device.stats()
  stats.frameTime = 0
  stats.model = 'lambertian'
  function frame(time: number) {
    updateCamera(camera, mouse, device)
    device.resize()
    device.drawCalls = 0
    stats.frameTime = performance.now()

    if (iblSampler.isReady) {
      iblSampler.panoramaToCubemap(panoramaTexture, cubeMap)
      iblSampler.draw(cubeMap)
    }

    device.clear(0xff2e2620, 1.0)
    device.depthState = DepthState.Default
    if (skyProgram.isReady) {
      world.initScaleUniform(10).setTranslation(camera.position)
      skyProgram.setUniform('World', world)
      skyProgram.setUniform('View', camera.view)
      skyProgram.setUniform('Projection', camera.projection)

      if (stats.model === 'lambertian') {
        skyProgram.setUniform('Texture', iblSampler.lambertianCubemap)
      }
      if (stats.model === 'ggx') {
        skyProgram.setUniform('Texture', iblSampler.ggxCubemap)
      }
      if (stats.model === 'sheen') {
        skyProgram.setUniform('Texture', iblSampler.sheenCubemap)
      }
      geometry.draw(skyProgram)
    }
    device.stats(stats)
    stats.frameTime = (performance.now() - stats.frameTime).toFixed(2)
    TweakUi.redraw()
  }

  TweakUi.mount(tools, (ui) => {
    ui.slider(iblSampler, 'scaleValue', { min: 0, max: 2, step: 0.01, label: 'Scale' })
    ui.select(iblSampler, 'textureSize', { label: 'Size', options: [64, 128, 256, 512, 1024] })
    ui.select(stats, 'model', {
      label: 'Model',
      options: ['lambertian', 'ggx', 'sheen'],
    })
    ui.object('GPU Stats', stats)
  })

  return loop(frame).stop
}

function demoCamera() {
  return {
    theta: 0,
    phi: 90,
    distance: 2,
    position: Vec3.create(),
    view: Mat4.createIdentity(),
    projection: Mat4.createIdentity(),
  }
}

function updateCamera(camera: ReturnType<typeof demoCamera>, mouse: Mouse, device: Device) {
  mouse.update()
  if (mouse.leftButtonIsPressed) {
    camera.theta -= mouse.dx * 0.1
    camera.phi -= mouse.dy * 0.1
  }
  if (mouse.middleButtonIsPressed) {
    camera.distance += mouse.dy * 0.01
    camera.distance = Math.max(0.1, camera.distance)
  }

  // prettier-ignore
  camera.position.initSpherical(
    camera.phi * DEGREE_TO_RAD,
    camera.theta * DEGREE_TO_RAD,
    camera.distance,
  )
  camera.view.initLookAt(camera.position, Vec3.Zero, Vec3.Up).invert()
  camera.projection.initPerspectiveFieldOfView(45 * DEGREE_TO_RAD, device.drawingBufferAspectRatio, 0.01, 1000)
}

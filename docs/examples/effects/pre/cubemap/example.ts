import { ContentLoader } from '@gglib/content'
import { IBLSamplerEffect } from '@gglib/effects'
import { DepthState, Device, createDevice, cubeGeometry, skyboxProgram, sphereGeometry } from '@gglib/graphics'
import { Mouse } from '@gglib/input'
import { HDR } from '@gglib/loaders'
import { AutoMaterial } from '@gglib/materials'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

const PANORAMA_IMAGES = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
  Sky: '/textures/Grey_Sky.png',
}
export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device: Device = createDevice({
    canvas,
  })

  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)
  const mouse = new Mouse({
    captureTarget: canvas,
    preventDefault: true,
  })

  const world = Mat4.createIdentity()
  const camera = demoCamera()
  const skyProgram = skyboxProgram(device)
  const cube = cubeGeometry(device, {})
  const sphere = sphereGeometry(device, {
    tesselation: 32,
  })
  const material = new AutoMaterial(device)
  material.Roughness = 0
  material.Metallic = 0.5

  const iblSampler = new IBLSamplerEffect(device)
  const params = {
    blur: 0,
    mipCount: iblSampler.lowestMipLevel + 1,
    model: 'lambertian',
  }

  async function loadEnvFile(url: string) {
    content.loadTexture(url).then((texture) => {
      iblSampler.panoramaInput?.dispose()
      iblSampler.panoramaInput = texture
      iblSampler.needsUpdate = true
    })
  }

  const stats = device.stats()
  stats.frameTime = 0

  function frame(time: number) {
    updateCamera(camera, mouse, device)
    device.resize()
    device.drawCalls = 0
    stats.frameTime = performance.now()

    if (iblSampler.panoramaInput) {
      iblSampler.update()
    }

    device.clear(0xff2e2620, 1.0)
    device.depthState = DepthState.Disabled
    if (skyProgram.isReady) {
      world.initScaleUniform(100).setTranslation(camera.position)
      skyProgram.setUniform('World', world)
      skyProgram.setUniform('View', camera.view)
      skyProgram.setUniform('Projection', camera.projection)
      skyProgram.setUniform('Blur', params.blur)
      skyProgram.setUniform('MipCount', params.mipCount)
      if (params.model === 'lambertian') {
        skyProgram.setUniform('Texture', iblSampler.lambertianCubemap)
      }
      if (params.model === 'ggx') {
        skyProgram.setUniform('Texture', iblSampler.ggxCubemap)
      }
      if (params.model === 'sheen') {
        skyProgram.setUniform('Texture', iblSampler.sheenCubemap)
      }
      cube.draw(skyProgram)
    }

    material.IrradianceMap = iblSampler.lambertianCubemap
    material.EnvironmentMap = iblSampler.ggxCubemap
    material.EnvironmentLUT = iblSampler.ggxLutMap
    // material.BaseColorMap = iblSampler.ggxLutMap
    material.ShadeFunction = 'shadePbr'

    if (material.isReady()) {
      world.initScaleUniform(1)
      material.LightCount = 1
      material.World = world
      material.View = camera.view
      material.Projection = camera.projection
      material.draw(sphere)
    }

    device.stats(stats)
    stats.frameTime = (performance.now() - stats.frameTime).toFixed(2)
    TweakUi.redraw()
  }

  TweakUi.mount(tools, (ui) => {
    loadEnvFile(PANORAMA_IMAGES.Overcast)
    ui.select({ env: PANORAMA_IMAGES.Overcast }, 'env', {
      options: PANORAMA_IMAGES,
      onChange: (it, value) => loadEnvFile(value as string),
    })
    ui.slider(iblSampler, 'scaleValue', {
      min: 0,
      max: 2,
      step: 0.01,
      label: 'Scale',
      oninput: () => {
        iblSampler.needsUpdate = true
      },
    })
    ui.select(iblSampler, 'textureSize', {
      label: 'Size',
      options: [64, 128, 256, 512, 1024],
      onChange: () => {
        iblSampler.needsUpdate = true
      },
    })
    ui.slider(params, 'blur', { label: 'Blur', min: 0, max: 1, step: 0.01 })
    ui.select(params, 'model', {
      label: 'Model',
      options: ['lambertian', 'ggx', 'sheen'],
    })
    ui.slider(material, 'Metallic', { label: 'Metallic', min: 0, max: 1, step: 0.01 })
    ui.slider(material, 'Roughness', { label: 'Roughness', min: 0, max: 1, step: 0.01 })
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

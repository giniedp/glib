import { NishitaSkyEffect, PanoramaToCubemapEffect, skyboxMaterial } from '@gglib/effects'
import {
  boxGeometry,
  Color,
  createDevice,
  FrameContext,
  PlatformId,
  SpriteBatch,
  Texture,
  TextureUsage,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, mat4$initPerspectiveFieldOfView, mat4$rotateX, mat4$rotateY, mat4Identity, vec3 } from '@gglib/math'
import { colorObject, mount } from 'tweak-ui'

const params = {
  animate: true,
  daySpeed: 0.2,
  dayTime: 0.02,
  sunElevation: 35,
  sunLatitude: 1.2,
  sunLongitude: 0,
  sunIntensity: 20,
  mieScattering: 0.001,
  rayleighScattering: 0.00025,
  phaseAsymmetry: -0.99,
  groundColor: vec3(0.1),
  exposure: 1,
  fieldOfView: 75,
  cameraPitch: 15,
  // faces sunLongitude = 0
  cameraYaw: 90,
  showBuffers: true,
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const panel = mount(tools, (ui) => {
    ui.group('Settings', { collapsible: true, defaultCollapsed: true }, () => {
      ui.group('Sun', () => {
        ui.bool(params, 'animate', { label: 'Animate' })
        ui.scalar(params, 'daySpeed', { range: true, min: 0, max: 2, decimals: 2 })
        ui.scalar(params, 'sunElevation', { label: 'Max elevation', range: true, min: 0, max: 90 })
        ui.scalar(params, 'sunLatitude', { label: 'Latitude (static)', range: true, min: 0, max: Math.PI })
        ui.scalar(params, 'sunLongitude', { range: true, min: -Math.PI, max: Math.PI })
        ui.scalar(params, 'sunIntensity', { range: true, min: 0, max: 100 })
      })
      ui.group('Scattering', () => {
        ui.scalar(params, 'mieScattering', { range: true, min: 0.0001, max: 0.01, decimals: 5 })
        ui.scalar(params, 'rayleighScattering', { range: true, min: 0.00005, max: 0.001, decimals: 5 })
        ui.scalar(params, 'phaseAsymmetry', { range: true, min: -0.999, max: 0.999, decimals: 5 })
        ui.color(params, 'groundColor', { format: colorObject('xyz') })
      })
      ui.group('View', () => {
        ui.scalar(params, 'exposure', { range: true, min: 0, max: 4 })
        ui.scalar(params, 'fieldOfView', { range: true, min: 10, max: 120 })
        ui.scalar(params, 'cameraPitch', { range: true, min: -90, max: 90 })
        ui.scalar(params, 'cameraYaw', { range: true, min: -180, max: 180 })
        ui.bool(params, 'showBuffers', { label: 'Show buffers' })
      })
    })
  })

  const spriteBatch = new SpriteBatch(device)
  const fxAtmosphere = new NishitaSkyEffect(device)
  const fxCubemap = new PanoramaToCubemapEffect(device)

  const pass = device.renderPass

  const panorama = device.createRenderTarget({
    name: 'Panorama Render Target',
    type: '2d',
    mipLevelCount: 5,
    width: 2048,
    height: 1024,
    usage: TextureUsage.TextureBinding,
    format: 'rgba16float',
  })

  const cubemap = device.createRenderTarget({
    name: 'Sky Cubemap Render Target',
    type: 'cube',
    mipLevelCount: 5,
    depth: 6,
    width: 512,
    height: 512,
    usage: TextureUsage.TextureBinding,
    format: 'rgba16float',
  })

  const rtScene = device.createRenderTarget({
    name: 'Scene Render Target',
    width: device.output.width,
    height: device.output.height,
    usage: TextureUsage.TextureBinding,
    format: 'rgba16float',
  })

  const geometry = boxGeometry(device)
  const material = skyboxMaterial(device, { cubemap })
  const viewProjection = mat4Identity()

  const sun = { latitude: params.sunLatitude, longitude: params.sunLongitude }
  function updateSun(ctx: FrameContext) {
    if (!params.animate) {
      sun.latitude = params.sunLatitude
      sun.longitude = params.sunLongitude
      return
    }
    // dayTime runs from 0 to 1: sunrise at 0, noon at 0.25, sunset at 0.5, then night
    params.dayTime = (params.dayTime + ctx.delta * params.daySpeed * 0.1) % 1
    const angle = params.dayTime * Math.PI * 2
    // latitude is measured from the zenith
    sun.latitude = Math.PI / 2 - Math.sin(angle) * params.sunElevation * DEGREE_TO_RAD
    // sun rises 45° left of sunLongitude, peaks at sunLongitude and sets 45° to the right
    sun.longitude = params.sunLongitude + (Math.cos(angle) * Math.PI) / 4
  }

  function drawBuffer(texture: Texture, x: number, y: number, width: number, exposure: number) {
    const height = (width * texture.height) / texture.width
    spriteBatch.begin()
    spriteBatch.linearToSrgb = true
    spriteBatch.exposure = exposure
    spriteBatch.next(texture).source(0, 0, texture.width, texture.height).destination(x, y, width, height)
    spriteBatch.draw()
    return y + height
  }

  function frame(ctx: FrameContext) {
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    if (!fxAtmosphere.isValid || !fxCubemap.isValid) {
      pass.flush()
      return
    }

    updateSun(ctx)

    // render the atmosphere into a panorama
    fxAtmosphere.sunLatitude = sun.latitude
    fxAtmosphere.sunLongitude = sun.longitude
    fxAtmosphere.sunIntensity = vec3(params.sunIntensity)
    fxAtmosphere.mieScattering = params.mieScattering
    fxAtmosphere.rayleighScattering = params.rayleighScattering
    fxAtmosphere.phaseAsymmetry = params.phaseAsymmetry
    fxAtmosphere.groundColor = params.groundColor
    fxAtmosphere.textureOut = panorama
    fxAtmosphere.render(pass)

    // convert the panorama into a cubemap
    fxCubemap.textureIn = panorama
    fxCubemap.textureOut = cubemap
    fxCubemap.render(pass)
    cubemap.updateMipmaps()

    // render the sky through the camera
    rtScene.resizeToMatch(device.output)
    mat4$initPerspectiveFieldOfView(
      viewProjection,
      params.fieldOfView * DEGREE_TO_RAD,
      rtScene.width / rtScene.height,
      0.1,
      100,
      device.ndcMinZ,
    )
    mat4$rotateX(viewProjection, -params.cameraPitch * DEGREE_TO_RAD)
    mat4$rotateY(viewProjection, params.cameraYaw * DEGREE_TO_RAD)

    pass.flush()
    pass.setRenderTarget(0, rtScene)
    pass.setViewportState(0, 0, rtScene.width, rtScene.height)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()
    material.EnvironmentMap = cubemap
    material.MipCount = cubemap.mipLevelCount
    material.ViewProjection = viewProjection
    material.effect.applyInputs(material.inputBlocks)
    material.effect.draw(pass, geometry)
    pass.submit()

    // present the sky and the intermediate buffers on screen
    pass.setRenderTarget(0, null)
    pass.setViewportState(0, 0, device.output.width, device.output.height)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    spriteBatch.begin()
    spriteBatch.linearToSrgb = true
    spriteBatch.exposure = params.exposure
    spriteBatch
      .next(rtScene)
      .source(0, 0, rtScene.width, rtScene.height)
      .flipY(device.isWebGL2 && rtScene.isRenderTarget)
      .destination(0, 0, device.output.width, device.output.height)
    spriteBatch.draw()

    if (params.showBuffers) {
      const margin = 8
      const width = Math.min(device.output.width / 4, 320)
      const x = margin
      let y = margin
      y = drawBuffer(fxAtmosphere.opticalLUT, x, y, width, 0.1) + margin
      y = drawBuffer(fxAtmosphere.mieScatteringMap, x, y, width, 0.1) + margin
      y = drawBuffer(fxAtmosphere.rayleighScatteringMap, x, y, width, 0.1) + margin
      y = drawBuffer(panorama, x, y, width, params.exposure) + margin
    }

    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
    panel.dispose()
  }
}

import { ContentLoader } from '@gglib/content'
import { NishitaSkyEffect } from '@gglib/effects'
import { Color, createDevice, PlatformId, SpriteBatch, TaskContext, TextureUsage } from '@gglib/graphics'
import { HDR } from '@gglib/loaders'
import { vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const files = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
  Memorial: '/textures/hdr/memorial.hdr',
}
const params = {
  sunLatitude: 0,
  sunLongitude: 0,
  sunIntensity: 20,
  mieScattering: 0.001,
  rayleighScattering: 0.00025,
  phaseAsymmetry: -0.99,
  groundColor: vec3(0.1),
}

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)

  mountUi(tools, (ui) => {
    ui.scalar(params, 'sunLatitude', { range: true, min: -Math.PI / 2, max: Math.PI / 2 })
    ui.scalar(params, 'sunLongitude', { range: true, min: -Math.PI, max: Math.PI })
    ui.scalar(params, 'sunIntensity', { range: true, min: 0, max: 100 })
    ui.scalar(params, 'mieScattering', { range: true, min: 0.0001, max: 0.01, decimals: 5 })
    ui.scalar(params, 'rayleighScattering', { range: true, min: 0.00005, max: 0.001, decimals: 5 })
    ui.scalar(params, 'phaseAsymmetry', { range: true, min: -0.999, max: 0.999, decimals: 5 })
    ui.color(params, 'groundColor', { format: '{n}xyz' })
  })

  const spriteBatch = new SpriteBatch(device)
  const fxAtmosphere = new NishitaSkyEffect(device)

  const pass = device.renderPass

  const panorama = device.createRenderTarget({
    name: 'Panorama Render Target',
    type: 'Texture2D',
    mipLevelCount: 5,
    width: 2048,
    height: 1024,
    usage: TextureUsage.TextureBinding,
    format: 'RGBA16_FLOAT',
  })

  function frame(ctx: TaskContext) {
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    if (fxAtmosphere.isValid) {
      fxAtmosphere.sunLatitude = params.sunLatitude
      fxAtmosphere.sunLongitude = params.sunLongitude
      fxAtmosphere.sunIntensity = vec3(params.sunIntensity)
      fxAtmosphere.mieScattering = params.mieScattering
      fxAtmosphere.rayleighScattering = params.rayleighScattering
      fxAtmosphere.phaseAsymmetry = params.phaseAsymmetry
      fxAtmosphere.groundColor = params.groundColor
      fxAtmosphere.textureOut = panorama
      fxAtmosphere.render(device.renderPass)
    }

    spriteBatch.begin()
    spriteBatch.linearToSrgb = true
    spriteBatch.exposure = 0.1
    spriteBatch
      .next(fxAtmosphere.opticalLUT)
      .source(0, 0, fxAtmosphere.opticalLUT.width, fxAtmosphere.opticalLUT.height)
      .destination(0, 0, device.output.width / 3, device.output.height / 2)
    spriteBatch.draw()

    spriteBatch.begin()
    spriteBatch.linearToSrgb = true
    spriteBatch.exposure = 0.1
    spriteBatch
      .next(fxAtmosphere.mieScatteringMap)
      .source(0, 0, fxAtmosphere.mieScatteringMap.width, fxAtmosphere.mieScatteringMap.height)
      .destination(device.output.width / 3, 0, device.output.width / 3, device.output.height / 2)
    spriteBatch.draw()

    spriteBatch.begin()
    spriteBatch.linearToSrgb = true
    spriteBatch.exposure = 0.1
    spriteBatch
      .next(fxAtmosphere.rayleighScatteringMap)
      .source(0, 0, fxAtmosphere.rayleighScatteringMap.width, fxAtmosphere.rayleighScatteringMap.height)
      .destination((device.output.width / 3) * 2, 0, device.output.width / 3, device.output.height / 2)
    spriteBatch.draw()

    spriteBatch.begin()
    spriteBatch.linearToSrgb = true
    spriteBatch.exposure = 1.0
    spriteBatch
      .next(panorama)
      .source(0, 0, panorama.width, panorama.height)
      .destination(0, device.output.height / 2, device.output.width, device.output.height / 2)
    spriteBatch.draw()

    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

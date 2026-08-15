import { ContentLoader } from '@gglib/content'
import {
  IblBRDFLutEffect,
  IblDistributionFunction,
  IblFilterEffect,
  PanoramaToCubemapEffect,
  SkyboxMaterial,
} from '@gglib/effects'
import {
  boxGeometry,
  Color,
  createDevice,
  PlatformId,
  SpriteBatch,
  TaskContext,
  Texture,
  TextureUsage,
} from '@gglib/graphics'
import { HDR } from '@gglib/loaders'
import { DEGREE_TO_RAD, Mat4 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const files = {
  Court: '/textures/hdr/footprint_court.hdr',
  Exterior: '/textures/hdr/cannon_exterior.hdr',
  Overcast: '/textures/hdr/overcast_puresky.hdr',
  Memorial: '/textures/hdr/memorial.hdr',
}
const params = {
  texture: files.Court,
  lutSampleCount: 512,
  lambertSampleCount: 2048,
  ggxSampleCount: 1024,
  charlieSampleCount: 64,
  intensity: 1,
  cubemap: 'cubemap' as DisplayCubemap,
  cubemapBlur: 0,
  frameTime: 0,
  fieldOfView: 60,
}

type DisplayCubemap = 'cubemap' | 'lambert' | 'ggx' | 'charlie'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)

  let texture: Texture
  mountUi(tools, (ui) => {
    loadTexture(params.texture)

    ui.group('Input', () => {
      ui.select(params, 'texture', {
        options: files,
        onchange: () => loadTexture(params.texture),
      })
    })

    ui.group('IBL Filter', () => {
      ui.scalar(params, 'lutSampleCount', { range: true, min: 32, max: 1024, step: 32 })
      ui.scalar(params, 'lambertSampleCount', { range: true, min: 32, max: 2048, step: 32 })
      ui.scalar(params, 'ggxSampleCount', { range: true, min: 32, max: 1024, step: 32 })
      ui.scalar(params, 'charlieSampleCount', { range: true, min: 32, max: 1024, step: 32 })
      ui.scalar(params, 'intensity', { range: true, min: 0, max: 10 })
    })

    ui.group('Cubemap', () => {
      ui.select(params, 'cubemap', {
        label: 'Display Cubemap',
        options: ['cubemap', 'lambert', 'ggx', 'charlie'] satisfies DisplayCubemap[],
      })
      ui.scalar(params, 'cubemapBlur', { label: 'Blur', range: true, min: 0, max: 1 })
      ui.scalar(params, 'fieldOfView', { range: true, min: 10, max: 120 })
    })
    ui.group('Performance', () => {
      ui.graph({
        rows: [
          {
            name: 'frameTime',
            sample: () => params.frameTime,
            fractionDigits: 2,
            smoothing: 0.9,
            min: 0,
            max: 50,
          },
        ],
      })
    })
  })

  async function loadTexture(url: string) {
    texture = await content.loadTexture(url)
  }

  const spriteBatch = new SpriteBatch(device)
  const fxCubemap = new PanoramaToCubemapEffect(device)
  const fxIblBrdf = new IblBRDFLutEffect(device)
  const fxIblFilter = new IblFilterEffect(device)

  const geometry = boxGeometry(device)
  const material = new SkyboxMaterial(device)

  const pass = device.renderPass

  const cubemap = device.createRenderTarget({
    name: 'Cybemap Render Target',
    type: 'TextureCube',
    mipLevelCount: 5,
    depth: 6,
    width: 512,
    height: 512,
    usage: TextureUsage.TextureBinding,
    format: 'RGBA16_FLOAT',
  })

  const rtScene = device.createRenderTarget({
    width: 512,
    height: 512,
    usage: TextureUsage.TextureBinding,
  })

  const lutGGX = device.createRenderTarget({
    width: 512,
    height: 512,
    format: 'RGBA16_FLOAT',
    usage: TextureUsage.TextureBinding,
  })
  const lutSheen = device.createRenderTarget({
    width: 512,
    height: 512,
    format: 'RGBA16_FLOAT',
    usage: TextureUsage.TextureBinding,
  })

  const envLambert = device.createRenderTarget({
    type: 'TextureCube',
    width: 256,
    height: 256,
    depth: 6,
    format: 'RGBA16_FLOAT',
    mipLevelCount: 5,
    usage: TextureUsage.TextureBinding,
  })
  const envGGX = device.createRenderTarget({
    type: 'TextureCube',
    width: 256,
    height: 256,
    depth: 6,
    format: 'RGBA16_FLOAT',
    mipLevelCount: 5,
    usage: TextureUsage.TextureBinding,
  })
  const envCharlie = device.createRenderTarget({
    type: 'TextureCube',
    width: 256,
    height: 256,
    depth: 6,
    format: 'RGBA16_FLOAT',
    mipLevelCount: 5,
    usage: TextureUsage.TextureBinding,
  })

  const world = Mat4.createIdentity()
  const proj = Mat4.createIdentity()

  function frame(ctx: TaskContext) {
    params.frameTime = ctx.dt
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    world.rotateY(-10 * DEGREE_TO_RAD * ctx.dt * 0.001)
    proj.initPerspectiveFieldOfView(
      params.fieldOfView * DEGREE_TO_RAD,
      rtScene.width / rtScene.height,
      0.1,
      100,
      device.ndcMinZ,
    )
    if (!texture || !fxIblBrdf.isValid || !fxIblFilter.isValid || !fxCubemap.isValid) {
      pass.flush()
      return
    }

    // generate cubemap from panorama
    fxCubemap.textureIn = texture
    fxCubemap.textureOut = cubemap
    fxCubemap.render(pass)
    cubemap.updateMipmaps()

    // generate GGX lookup table
    fxIblBrdf.textureOut = lutGGX
    fxIblBrdf.distribution = IblDistributionFunction.GGX
    fxIblBrdf.samples = params.lutSampleCount
    fxIblBrdf.render(pass)

    // generate Charlie lookup table
    fxIblBrdf.textureOut = lutSheen
    fxIblBrdf.distribution = IblDistributionFunction.CHARLIE
    fxIblBrdf.samples = params.lutSampleCount
    fxIblBrdf.render(pass)

    // setup common inputs for IBL filter
    fxIblFilter.cubemapIn = cubemap

    fxIblFilter.intensity = params.intensity

    // generate radiance cubemap
    fxIblFilter.cubemapOut = envLambert
    fxIblFilter.samples = params.lambertSampleCount
    fxIblFilter.distribution = IblDistributionFunction.LAMBERT
    fxIblFilter.render(pass)

    // generate irradiance cubemap
    fxIblFilter.cubemapOut = envGGX
    fxIblFilter.samples = params.ggxSampleCount
    fxIblFilter.distribution = IblDistributionFunction.GGX
    fxIblFilter.render(pass)

    // generate sheen cubemap
    fxIblFilter.cubemapOut = envCharlie
    fxIblFilter.samples = params.charlieSampleCount
    fxIblFilter.distribution = IblDistributionFunction.CHARLIE
    fxIblFilter.render(pass)

    // render cubemap to scene render target
    pass.flush()
    pass.setRenderTarget(0, rtScene)
    pass.setViewportState(0, 0, rtScene.width, rtScene.height)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()
    switch (params.cubemap) {
      case 'cubemap':
        material.EnvironmentMap = cubemap
        break
      case 'lambert':
        material.EnvironmentMap = envLambert
        break
      case 'ggx':
        material.EnvironmentMap = envGGX
        break
      case 'charlie':
        material.EnvironmentMap = envCharlie
        break
    }
    material.Blur = params.cubemapBlur
    material.MipCount = material.EnvironmentMap.mipLevelCount
    material.ViewProjection = proj
    material.ObjectModel = world
    material.effect.applyInputs(material.inputBlocks)
    material.effect.draw(pass, geometry)
    pass.submit()

    // present all render targets to screen
    pass.setRenderTarget(0, null)
    pass.setViewportState(0, 0, device.output.width, device.output.height)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    let size = Math.min(device.output.width / 2, device.output.height / 2)
    let offset = (device.output.width - size - size) / 2
    spriteBatch.begin()
    spriteBatch.next(texture).source(0, 0, texture.width, texture.height).destination(offset, 0, size, size)

    spriteBatch
      .next(rtScene)
      .source(0, 0, rtScene.width, rtScene.height)
      .flipY(device.isWebGL2 && rtScene.isRenderTarget)
      .destination(offset + size, 0, size, size)

    spriteBatch.next(lutGGX).source(0, 0, lutGGX.width, lutGGX.height).destination(offset, size, size, size)

    spriteBatch
      .next(lutSheen)
      .source(0, 0, lutSheen.width, lutSheen.height)
      .destination(offset + size, size, size, size)

    spriteBatch.draw()

    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

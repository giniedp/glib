import { ContentLoader } from '@gglib/content'
import {
  CombineEffect,
  CombineOperator,
  DownsampleEffect,
  DownsampleOperator,
  ExtractEffect,
  ExtractOperator,
  TonemapEffect,
  TonemapOperator,
  UpsampleEffect,
  UpsampleOperator,
} from '@gglib/effects'
import {
  BlendState,
  Color,
  createDevice,
  PlatformId,
  SpriteBatch,
  TaskContext,
  Texture,
  TextureUsage,
} from '@gglib/graphics'
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
  texture: files.Court,
  zoom: 2,
  animate: false,
  knee: 0.5,
  threshold: 0.75,
  range: 0.5,
  colorKeyR: 0,
  colorKeyG: 0,
  colorKeyB: 0,
  operatorId: ExtractOperator.HIGH_PASS,

  downsampleOperator: DownsampleOperator.KAWASE,
  downsampleSteps: 6,
  upsampleOperator: UpsampleOperator.KAWASE,
  upsampleWeight: 0.5,

  combineOperator: CombineOperator.ADD,
  combineWeight1: 1,
  combineWeight2: 1,
  combineBlend: 1,

  tonemapOperator: TonemapOperator.PBR_NEUTRAL,
  tonemapExposure: 1,

  output: 'result' as Output,
}

type Output = 'scene' | 'extract' | 'downsample' | 'blur' | 'combine' | 'result'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready

  const content = new ContentLoader(device)
  content.registerLoader(HDR.Loader)

  let texture: Texture
  mountUi(tools, (ui) => {
    loadTexture(params.texture)

    ui.select(params, 'texture', {
      options: files,
      onchange: () => loadTexture(params.texture),
    })
    ui.scalar(params, 'zoom', { range: true, min: 0.1, max: 10 })
    ui.bool(params, 'animate')
    ui.select(params, 'output', {
      options: ['scene', 'extract', 'downsample', 'blur', 'combine', 'result'] satisfies Array<Output>,
      onchange: () => loadTexture(params.texture),
    })
    ui.group('Extract', { collapsible: true }, () => {
      ui.select(params, 'operatorId', {
        label: 'Operator',
        options: ExtractOperator,
      })
      ui.scalar(params, 'knee', { range: true, min: 0, max: 1 })
      ui.scalar(params, 'threshold', { range: true, min: 0, max: 1 })
      ui.scalar(params, 'range', { range: true, min: 0, max: 1 })
      ui.flex({ flow: 'row' }, () => {
        ui.scalarInput(params, 'colorKeyR', { range: true, min: 0, max: 1 })
        ui.scalarInput(params, 'colorKeyG', { range: true, min: 0, max: 1 })
        ui.scalarInput(params, 'colorKeyB', { range: true, min: 0, max: 1 })
      })
    })
    ui.group('Blur', () => {
      ui.scalar(params, 'downsampleSteps', { range: true, min: 1, max: 10, step: 1 })
      ui.select(params, 'downsampleOperator', {
        options: DownsampleOperator,
      })
      ui.select(params, 'upsampleOperator', {
        options: UpsampleOperator,
      })
      ui.scalar(params, 'upsampleWeight', { range: true, min: 0, max: 1 })
    })
    ui.group('Combine', () => {
      ui.select(params, 'combineOperator', {
        label: 'Operator',
        options: CombineOperator,
      })
      ui.scalar(params, 'combineWeight1', { label: 'Weight1', range: true, min: 0, max: 3 })
      ui.scalar(params, 'combineWeight2', { label: 'Weight2', range: true, min: 0, max: 3 })
      ui.scalar(params, 'combineBlend', { label: 'Blend', range: true, min: 0, max: 1 })
    })
    ui.group('Tonemap', () => {
      ui.select(params, 'tonemapOperator', {
        label: 'Operator',
        options: TonemapOperator,
      })
      ui.scalar(params, 'tonemapExposure', { label: 'Exposure', range: true, min: 0, max: 10 })
    })
  })

  async function loadTexture(url: string) {
    texture = await content.loadTexture(url)
  }

  const spriteBatch = new SpriteBatch(device)
  const fxExtract = new ExtractEffect(device)
  const fxDownsample = new DownsampleEffect(device)
  const fxUpsample = new UpsampleEffect(device)
  const fxCombine = new CombineEffect(device)
  const fxTonemap = new TonemapEffect(device)
  const pass = device.renderPass

  const sceneTarget = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'RGBA16_FLOAT',
    usage: TextureUsage.TextureBinding,
  })

  const extractTarget = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'RGBA16_FLOAT',
    usage: TextureUsage.TextureBinding,
  })

  const blurTarget = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'RGBA16_FLOAT',
    usage: TextureUsage.TextureBinding,
  })

  const downsampleTargets: Texture[] = []
  for (let i = 0; i < 10; i++) {
    downsampleTargets[i] = device.createRenderTarget({
      width: Math.ceil(device.output.width / Math.pow(2, i + 1)),
      height: Math.ceil(device.output.height / Math.pow(2, i + 1)),
      format: 'RGBA16_FLOAT',
      usage: TextureUsage.TextureBinding,
    })
  }

  const combineTarget = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'RGBA16_FLOAT',
    usage: TextureUsage.TextureBinding,
  })

  const outputs: Record<Output, Texture> = {
    scene: sceneTarget,
    extract: extractTarget,
    get downsample() {
      return downsampleTargets[params.downsampleSteps - 1]
    },
    blur: blurTarget,
    combine: combineTarget,
    result: null!,
  }

  function frame(ctx: TaskContext) {
    sceneTarget.resizeToMatch(device.output)
    extractTarget.resizeToMatch(device.output)
    blurTarget.resizeToMatch(device.output)
    combineTarget.resizeToMatch(device.output)

    for (let i = 0; i < params.downsampleSteps; i++) {
      downsampleTargets[i].resize(
        Math.ceil(device.output.width / Math.pow(2, i + 1)),
        Math.ceil(device.output.height / Math.pow(2, i + 1)),
      )
    }

    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()

    if (
      !texture ||
      !spriteBatch.isReady ||
      !fxExtract.isCompiled ||
      !fxDownsample.isCompiled ||
      !fxUpsample.isCompiled ||
      !fxCombine.isCompiled ||
      !fxTonemap.isCompiled
    ) {
      pass.flush()
      return
    }

    pass.setClearColor(0, Color.TransparentBlack)
    pass.setRenderTarget(0, sceneTarget)
    pass.clear()
    pass.setRenderTarget(0, extractTarget)
    pass.clear()
    pass.setRenderTarget(0, blurTarget)
    pass.clear()
    pass.setRenderTarget(0, combineTarget)
    pass.clear()

    // render scene
    pass.setRenderTarget(0, sceneTarget)
    pass.setClearColor(0, Color.TransparentBlack)
    pass.clear()
    const offX = !params.animate ? 0 : Math.sin(Math.PI * 2 * ctx.time * 0.0001) * 100
    const offY = !params.animate ? 0 : Math.cos(Math.PI * 2 * ctx.time * 0.0001) * 100

    spriteBatch.linearToSrgb = false
    spriteBatch.begin()
    spriteBatch
      .next(texture)
      .source(0, 0, texture.width, texture.height)
      .destination(
        Math.floor((device.output.width - texture.width * params.zoom) * 0.5) + offX,
        Math.floor((device.output.height - texture.height * params.zoom) * 0.5) + offY,
        texture.width * params.zoom,
        texture.height * params.zoom,
      )
    spriteBatch.draw()

    // extract pass
    fxExtract.operatorId = params.operatorId
    fxExtract.knee = params.knee
    fxExtract.range = params.range
    fxExtract.threshold = params.threshold
    fxExtract.colorKey = vec3(params.colorKeyR, params.colorKeyG, params.colorKeyB)
    fxExtract.textureIn = sceneTarget
    fxExtract.textureOut = extractTarget
    fxExtract.render(pass)

    // downsample pass
    for (let i = 0; i < params.downsampleSteps; i++) {
      fxDownsample.operator = params.downsampleOperator
      if (fxDownsample.operator === DownsampleOperator.JIMENEZ_13TAP_KARIS && i !== 0) {
        // karis average usually is only used in first downsample step
        fxDownsample.operator = DownsampleOperator.JIMENEZ_13TAP
      }
      fxDownsample.textureIn = i === 0 ? extractTarget : downsampleTargets[i - 1]
      fxDownsample.textureOut = downsampleTargets[i]
      fxDownsample.render(pass)
    }

    // upsample pass
    for (let i = params.downsampleSteps - 1; i >= 0; i--) {
      pass.setRenderBlend(0, BlendState.Additive)
      fxUpsample.operator = params.upsampleOperator
      fxUpsample.weight = params.upsampleWeight
      fxUpsample.textureIn = downsampleTargets[i]
      fxUpsample.textureOut = downsampleTargets[i - 1] || blurTarget
      fxUpsample.render(pass)
      pass.setRenderBlend(0, BlendState.Opaque)
    }

    // combine pass
    fxCombine.operator = params.combineOperator
    fxCombine.textureIn1 = sceneTarget
    fxCombine.textureIn2 = blurTarget
    fxCombine.textureOut = combineTarget
    fxCombine.weight1 = params.combineWeight1
    fxCombine.weight2 = params.combineWeight2
    fxCombine.blend = params.combineBlend
    fxCombine.render(pass)

    // tonemap pass
    fxTonemap.exposure = params.tonemapExposure
    fxTonemap.operator = params.tonemapOperator
    fxTonemap.textureIn = combineTarget
    fxTonemap.textureOut = device.output
    fxTonemap.srgb = true
    fxTonemap.render(pass)

    // render result
    const result = outputs[params.output]
    if (result) {
      pass.setRenderTarget(0, null)
      spriteBatch.begin()
      spriteBatch
        .next(result)
        .source(0, 0, result.width, result.height)
        .destination(0, 0, device.output.width, device.output.height)
        .flipY(result.isRenderTarget && device.isWebGL2)
      spriteBatch.draw()
    }
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

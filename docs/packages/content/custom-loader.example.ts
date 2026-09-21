import { AssetType, ContentLoader } from '@gglib/content'
import { CommonMaterial } from '@gglib/effects'
import { Color, createDevice, CullState, DepthState, FrameContext, PlatformId } from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4 } from '@gglib/math'
import { Model } from '@gglib/model'
import { mountUi } from 'tweak-ui'
import { PixelsLoader } from './pixels-loader'

export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device = await createDevice({ canvas, platform, autosize: true }).ready
  const content = new ContentLoader(device)

  // The PixelsLoader class implements the registerable interface.
  // We can just pass the class into the registry.
  content.registerLoader(PixelsLoader)

  // Hardcoded options that we can pick from for this demo
  const assets = ['/megaman.pixels', '/sonic.pixels', '/mario.pixels']
  const scene = {
    model: null! as Model,
  }

  // loadModel will be called with one of the asset paths
  function loadModel(path: string) {
    content
      .loadModel(path, {
        // For demonstraion purposes enforce a type, that will be matched against all
        // registered loaders. Not needed here, since the path already contains
        // the .pixels extension which would be used otherwise
        type: '.pixels',
      })
      .then((result) => {
        scene.model = result
      })
  }

  // load initial asset and mount the ui options
  loadModel(assets[0])
  mountUi(tools, (ui) => {
    ui.select({ model: assets[0] }, 'model', {
      options: assets,
      onchange: (_, value) => loadModel(value),
    })
  })

  // everything else is just common scene rendering procedure
  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const proj = Mat4.createIdentity()
  const cam = Mat4.createIdentity()

  const msaaDepth = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS_STENCIL8',
    sampleCount: 4,
  })
  const msaaColor = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })

  const pass = device.renderPass
  function frame(ctx: FrameContext) {
    msaaColor.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)

    let t = ctx.time

    cam.initTranslationXYZ(0, 0, 30)
    view.initFrom(cam).invert()
    proj.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    if (scene.model) {
      world.initRotationY(t * DEGREE_TO_RAD * 25)
      for (const mesh of scene.model.meshes) {
        for (const material of mesh.materials) {
          const mtl = material as CommonMaterial
          mtl.World = world
          mtl.View = view
          mtl.Projection = proj
          mtl.CameraPosition = cam.getTranslation()
        }
      }
    }

    pass.setRenderTarget(0, msaaColor, 0, 0, device.output)
    pass.setDepthTarget(msaaDepth)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearDepth(1)
    pass.clear()
    pass.setDepthState(DepthState.LessEqual)
    pass.setCullState(CullState.CullBack)

    if (scene.model) {
      scene.model.draw()
    }

    pass.submit()
    pass.resolve()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}

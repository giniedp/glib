import { ContentLoader } from '@gglib/content'
import { CommonMaterial } from '@gglib/effects'
import { Color, createDevice, CullState, DepthState, FrameContext, PlatformId } from '@gglib/graphics'
import {
  DEGREE_TO_RAD,
  mat4$initPerspectiveFieldOfView,
  mat4$initRotationY,
  mat4$initTranslationXYZ,
  mat4GetTranslation,
  mat4Identity,
  mat4Invert,
} from '@gglib/math'
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
  const world = mat4Identity()
  const view = mat4Identity()
  const proj = mat4Identity()
  const cam = mat4Identity()

  const msaaDepth = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'depth24plus-stencil8',
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

    mat4$initTranslationXYZ(cam, 0, 0, 30)
    mat4Invert(cam, view)
    mat4$initPerspectiveFieldOfView(proj, 60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    if (scene.model) {
      mat4$initRotationY(world, t * DEGREE_TO_RAD * 25)
      for (const mesh of scene.model.meshes) {
        for (const material of mesh.materials) {
          const mtl = material as CommonMaterial
          mtl.World = world
          mtl.View = view
          mtl.Projection = proj
          mat4GetTranslation(cam, mtl.CameraPosition)
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

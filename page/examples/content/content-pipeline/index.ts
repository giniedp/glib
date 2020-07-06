import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

import {
  BlendState,
  buildCube,
  Color,
  CullState,
  DepthState,
  DeviceGL,
  LightType,
  Model,
  ModelBuilder,
} from '@gglib/graphics'

import {
  ContentManager,
  loader,
} from '@gglib/content'

import {
  AutoMaterial,
  LightParams,
} from '@gglib/effects'

// This symbol will be used to identify the made up `.pixels` format that is used for this demo.
const PixelsData = Symbol('PixelsData')

// Now register a `loader` function
loader({
  // This loader will only be called on files with the `.pixels` extension
  input: '.pixels',
  // And only if the output is requested with our `PixelsData` symbol
  output: PixelsData,
  // This is the actual `loader` function
  handle: (input, context) => {
    // it simply downloads the file...
    return context.manager.download(context.source).then((asset) => {
      // ... and returns the downloaded file content.
      return asset.content
    })
  },
})

// We have defined a loader from `.pixels` -> `PixelsData`.
// Now we need a second loader going from `PixelsData` ~> `Model`.
// Actually we only need a loader from `PixelsData` ~> `Model.Options`
// because there is already a built in loader `Model.Options` ~> `Model`

// Now register the second loader.
loader({
  // This one will only be called on a content that is marked as being a `PixelsData`
  input: PixelsData,
  // and only if the output is requested as `Model.Options`
  output: Model.Options,
  // This is the actual `loader` function
  handle: (input: string, context) => {
    // it uses a lookup map for colors
    const colorMap = {
      0: Color.rgba(0, 0, 0, 255),
      1: Color.rgba(255, 0, 0, 255),
      2: Color.rgba(0, 255, 0, 255),
      3: Color.rgba(255, 255, 0, 255),
      4: Color.rgba(0, 0, 255, 255),
      5: Color.rgba(255, 0, 255, 255),
      6: Color.rgba(0, 255, 255, 255),
      7: Color.rgba(255, 255, 255, 255),
    }
    const gap = 0.1

    // and  utilizes a `ModelBuilder` to build up a 3d model
    // by running though the `PixelsData` and adding colored 3d cubes.
    const builder = new ModelBuilder({ layout: 'PositionNormalColor' })
    const transform = Mat4.createIdentity()

    const rows = input.split('\n')
    rows.forEach((row, y) => {
      const cols = row.trim().split('')
      return cols.forEach((col, x) => {
        if (!(col in colorMap)) { return }
        transform.initTranslation(
          x  - cols.length / 2 + 0.5 +  x  * gap,
          rows.length - y  - rows.length / 2 + 0.5 - y  * gap,
          0)
        builder.withTransform(transform, () => {
          builder.defaultAttributes.color = colorMap[col]
          buildCube(builder, { size: 1 })
        })
      })
    })
    const material = new AutoMaterial(device)
    material.VertexColor = true
    material.LightCount = 1

    const result = builder
      .calculateNormals()
      .calculateBoundings()
      .endModel({
        materials: [material],
      })
    return Promise.resolve(result)
  },
})

// No we have added 2 `loaders` to the pipeline. We created a graph going
// from `.pixels` -> `PixelsData` -> `Model.Options`.
// The pipeline itself has several built in `loader` functions for example
// `Model.Options` ~> `Model`

const device = new DeviceGL({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})
const content = new ContentManager(device)

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()
const light = new LightParams()
light.color = [0.8, 0.8, 0.8]
light.position = [0, 0, 500]
light.direction = [0, 0, -1]
light.type = LightType.Directional
light.enabled = true

let model: Model

loop((time, dt) => {
  let time2pi = time * 2 * Math.PI

  device.resize()
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.clear(0xff2e2620, 1.0)

  cam.initTranslation(0, 0, 30)
  view.initFrom(cam).invert()
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 1, 1000)

  if (model) {
    world.initRotationY(time2pi / 5000)

    model.materials.forEach((material) => {
      let params = material.parameters

      params.World = world
      params.View = view
      params.Projection = proj
      params.CameraPosition = cam.getTranslation()
      light.assign(0, params)
    })
    model.draw()
  }
})

// When we call `content.load('megaman.pixels', Model)`
// the pipeline will decide to go through our custom loader functions
// starting at the `.pixels` loader and then continue with every loader
// that leads to the output of type `Model`.
//
// If multiple pathes are available, the pipeline will decide for the
// shortest path

let assets = ['./megaman.pixels', './sonic.pixels', './mario.pixels']
function loadModel(path: string) {
  content.load(path, Model).then((result) => {
    model = result
  })
}
loadModel(assets[0])

TweakUi.build('#tweak-ui', (q) => {
  q.select({ model: assets[0] }, 'model', {
    options: assets,
    onChange: (ctrl) => {
      loadModel(ctrl.target.model)
    },
  })
})

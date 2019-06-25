
// # Content Pipeline
//
// ---
//
// The pipeline can be customized by adding `loader` functions.
// A `loader` function must be registered with an `input` and `output` type.
//
// In this example we want to load a file with the extension `.pixels` and transform it
// into a 3d `Model`.

import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

import {
  BlendState,
  buildCube,
  Color,
  CullState,
  DepthState,
  Device,
  Model,
  ModelBuilder,
} from '@gglib/graphics'

import {
  loader,
  Manager,
} from '@gglib/content'
import { AutoMaterial } from '@gglib/effects';

// For this we want to have an intermediate format called `PixelsData` which we want to
// identify by this symbol
const PixelsData = Symbol('PixelsData')

// Now register a `loader` function
loader({
  // This loader will only be called on files with the `.pixels` extension
  input: '.pixels',
  // And only if the output is requested as `PixelsData`
  output: PixelsData,
  // This is the actual `loader` function
  handle: (input, context) => {
    // it simply downloads the file
    return context.manager.download(context.source).then((asset) => {
      // and returns the downloaded file content.
      return asset.content
    })
  },
})

// Now register a second loader.
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

const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})
const content = new Manager(device)

const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()
let model: Model

let time = 0
loop((dt) => {
  time += dt
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

      params.Lights0Color = [1, 1, 1, 0.8]
      params.Lights0Position = [0, 0, 500]
      params.Lights0Direction = [0, 0, -1, 1]
      params.Lights0Misc = [
        1000, // point light range
        0,
        0,
        2,     // 1:directional 2:point
      ]
    })
    model.draw()
  }
})

// Now when we call `content.load(megaman.pixels, Model)`
// the pipeline will decide to go through our custom loader functions
// starting at the `.pixels` loader and then continue with every loader
// that leads to the output of type `Model`.
//
// If multiple pathes are available, the pipeline will decide for the
// shortest path

let assets = ['/megaman.pixels', '/sonic.pixels', '/mario.pixels']
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

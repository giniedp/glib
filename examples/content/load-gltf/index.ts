// # glTF Models
//
// Glib is able to load glTF models. This example references the
// Khronos [glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models) repository on github.
//
// For more information about the glTF format visit the specification
// at [https://github.com/KhronosGroup/glTF](https://github.com/KhronosGroup/glTF)
//
// ---

import { Manager } from '@gglib/content'
import { loop } from '@gglib/core'
import { BlendState, CullState, DepthState, Device, Model } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import * as TweakUi from 'tweak-ui'

const baseUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/'
const models = {
  Avocado:                  `${baseUrl}Avocado/glTF/Avocado.gltf`,
  BarramundiFish:           `${baseUrl}BarramundiFish/glTF/BarramundiFish.gltf`,
  BoomBox:                  `${baseUrl}BoomBox/glTF/BoomBox.gltf`,
  BoxInterleaved:           `${baseUrl}BoxInterleaved/glTF/BoxInterleaved.gltf`,
  BoxTextured:              `${baseUrl}BoxTextured/glTF/BoxTextured.gltf`,
  'BoxTextured (binary)':   `/assets/models/BoxTextured.glb`,
  'BoxTextured (embedded)': `${baseUrl}BoxTextured/glTF-Embedded/BoxTextured.gltf`,
  'BoxTextured (specular)': `${baseUrl}BoxTextured/glTF-pbrSpecularGlossiness/BoxTextured.gltf`,
  CesiumMan:                `${baseUrl}CesiumMan/glTF/CesiumMan.gltf`,
  CesiumMilkTruck:          `${baseUrl}CesiumMilkTruck/glTF/CesiumMilkTruck.gltf`,
  Corset:                   `${baseUrl}Corset/glTF/Corset.gltf`,
  Cube:                     `${baseUrl}Cube/glTF/Cube.gltf`,
  DamagedHelmet:            `${baseUrl}DamagedHelmet/glTF/DamagedHelmet.gltf`,
  Duck:                     `${baseUrl}Duck/glTF/Duck.gltf`,
  FlightHelmet:             `${baseUrl}FlightHelmet/glTF/FlightHelmet.gltf`,
  Lantern:                  `${baseUrl}Lantern/glTF/Lantern.gltf`,
  MetalRoughSpheres:        `${baseUrl}MetalRoughSpheres/glTF/MetalRoughSpheres.gltf`,
  Monster:                  `${baseUrl}Monster/glTF/Monster.gltf`,
  NormalTangentMirrorTest:  `${baseUrl}NormalTangentMirrorTest/glTF/NormalTangentMirrorTest.gltf`,
  NormalTangentTest:        `${baseUrl}NormalTangentTest/glTF/NormalTangentTest.gltf`,
  SciFiHelmet:              `${baseUrl}SciFiHelmet/glTF/SciFiHelmet.gltf`,
  Sponza:                   `${baseUrl}Sponza/glTF/Sponza.gltf`,
  Suzanne:                  `${baseUrl}Suzanne/glTF/Suzanne.gltf`,
  TextureCoordinateTest:    `${baseUrl}TextureCoordinateTest/glTF/TextureCoordinateTest.gltf`,
  TextureSettingsTest:      `${baseUrl}TextureSettingsTest/glTF/TextureSettingsTest.gltf`,
  TextureTransformTest:     `${baseUrl}TextureTransformTest/glTF/TextureTransformTest.gltf`,
  Triangle:                 `${baseUrl}Triangle/glTF/Triangle.gltf`,
  TriangleWithoutIndices:   `${baseUrl}TriangleWithoutIndices/glTF/TriangleWithoutIndices.gltf`,
  VC:                       `${baseUrl}VC/glTF/VC.gltf`,
  'VC (glossiness)':        `${baseUrl}VC/glTF-pbrSpecularGlossiness/VC.gltf`,
  WaterBottle:              `${baseUrl}WaterBottle/glTF/WaterBottle.gltf`,
  RiggedSimple:             `${baseUrl}RiggedSimple/glTF/RiggedSimple.gltf`,
}

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create the content manager
const content = new Manager(device)

// Declare scene variables
let model: Model = null
let scale = 1
const controls = {
  distance: 1.5,
  offset: 0,
  fov: 90,
  update: true,
}

// Allow scene variables to be manipulated via gui controls
TweakUi.build('#tweak-ui', (q: TweakUi.Builder) => {
  loadModel(models.BarramundiFish)
  q.select({ model: models.BarramundiFish }, 'model', {
    options: models,
    onChange: (it, value) => loadModel(value),
  })
  q.slider(controls, 'distance', { min: 0.01, max: 3 })
  q.slider(controls, 'offset', { min: -3, max: 3})
  q.slider(controls, 'fov', { min: 1, max: 120, step: 1 })
  q.checkbox(controls, 'update')
})

// This is called every time a model has been selected
// In case of an error the model will not be rendered
// and the error will be logged to console
function loadModel(url: string) {
  content.load(url, Model).then((result) => {
    model = result
    if (model) {
      scale = 1 / model.boundingSphere.radius
      console.log(model)
    }
  }).catch((e) => {
    model = null
    console.error(e)
  })
}

// Declare runtime variables
const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
const cam = Mat4.createIdentity()

// Begin the rendering loop and accumulate the time
let time = 0
loop((dt) => {
  if (controls.update) {
    time += dt
  }

  // Resize and clear the screen
  device.resize()
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.clear(0xff2e2620, 1.0)

  // Do not proceed until model is loaded
  if (!model) {
    return
  }

  // Update runtime variables
  world
    .initTranslation(-model.boundingSphere.center.x, -model.boundingSphere.center.y, -model.boundingSphere.center.z)
    .rotateY(time / 4000)
    .scaleUniform(scale)
  cam.initLookAt(
    { x: 0, y: controls.offset, z: controls.distance },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  )
  Mat4.invert(cam, view)
  proj.initPerspectiveFieldOfView(controls.fov * Math.PI / 180, device.drawingBufferAspectRatio, 0.001, 10)

  // Update materials
  model.materials.forEach((material) => {
    const params = material.parameters

    params.World = world
    params.View = view
    params.Projection = proj
    params.CameraPosition = cam.getTranslation()

    // Update light properties
    params.Lights0Color = [1, 1, 1, 1.5]
    params.Lights0Direction = [0, -1, -1, 1]
    params.Lights0Misc = [
      1000, // point light range
      0,
      0,
      1,     // 1:dir light 2:point light
    ]
  })

  // Draw the model.
  // In case of an error the model is cleared and the error is logged to console
  try {
    model.draw()
  } catch (e) {
    console.error(e)
    model = null
  }
})

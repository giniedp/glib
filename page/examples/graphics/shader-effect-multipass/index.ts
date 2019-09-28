import { BlendState, buildSphere, CullState, DepthState, Device, ModelBuilder } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = new Device({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.

const effect = device.createEffect({
  name: 'Multipass Effect',
  techniques: [{
    passes: [{
      name: 'color pass',
      blendState: BlendState.Default,
      program: device.createProgram({
        vertexShader: document.getElementById('vertex-shader').textContent,
        fragmentShader: document.getElementById('fragment-shader').textContent,
      }),
    }, {
      name: 'glow pass',
      blendState: BlendState.Additive,
      program: device.createProgram({
        vertexShader: document.getElementById('vertex-shader').textContent,
        fragmentShader: document.getElementById('fragment-shader2').textContent,
      }),
    }],
  }],
})

// Create a texture object.
// Simply pass an URL to the image that should be used as a texture.
const texture = device.createTexture({
  data: '/assets/textures/prototype/proto_red.png',
})

// Create Cube mesh which is going to be rendered
const mesh = ModelBuilder.begin().tap(buildSphere).endMesh(device)

// Allocate state variables
const world = Mat4.createIdentity()
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()
let time = 0

// Begin render loop
loop((time, dt) => {

  // prepare render state
  device.resize()
  device.cullState = CullState.CullClockWise
  device.depthState = DepthState.Default
  device.blendState = BlendState.Default
  device.clear(0xff2e2620, 1.0)

  // update the scene
  world.initRotationY(time / 1000)
  view.initTranslation(0, 0, -2)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 1, 100)

  // Assign effect parameters.
  effect.parameters.world = world
  effect.parameters.view = view
  effect.parameters.projection = proj
  effect.parameters.texture = texture
  effect.parameters.eyePosition = view.getTranslation()
  effect.parameters.time = time / 1000

  // Render the mesh
  // This will actually commit the effect parameters when
  // rendering each pass
  effect.draw(mesh)
})

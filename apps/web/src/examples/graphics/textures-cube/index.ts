import { buildCube, CullState, ModelBuilder, DepthState, TextureWrapMode, TextureFilter, createDevice } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
let device = createDevice({ canvas: '#canvas' })

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
let program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create the geometry
let geometry = new ModelBuilder().append(buildCube).endMeshPart(device)

// Create a cubemap from 6 faces.
// The `faces` option must contain 6 entries.
// Each entry may be any data type that is a valid `data` option
// like when creating a 2D texture
let texture = device.createTextureCube({
  faces: [
    '/assets/textures/cubemaps/dust_rt.jpg',
    '/assets/textures/cubemaps/dust_lf.jpg',
    '/assets/textures/cubemaps/dust_up.jpg',
    '/assets/textures/cubemaps/dust_dn.jpg',
    '/assets/textures/cubemaps/dust_bk.jpg',
    '/assets/textures/cubemaps/dust_ft.jpg',
  ],
  samplerParams: {
    minFilter: TextureFilter.Linear,
    magFilter: TextureFilter.Linear,
    wrapU: TextureWrapMode.Clamp,
    wrapV: TextureWrapMode.Clamp,
    wrapW: TextureWrapMode.Clamp,
  }
})

// Create world, view and projection matrices.
let world = Mat4.createIdentity()
let view = Mat4.createIdentity()
let proj = Mat4.createIdentity()

loop((time) => {

  // Prepare for rendering.
  device.resize()
  device.clear(0xff2e2620, 1.0)
  device.depthState = DepthState.Default
  device.cullState = CullState.CullCounterClockWise

  // Update scene.
  world.initIdentity()
    .rotateY((Math.PI * time) / 20000)
  view.initTranslation(0, 0, -1)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0, 100)

  // Update program uniforms
  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)
  program.setUniform('texture', texture)


  // and render geometry with program.
  geometry.draw(program)
})

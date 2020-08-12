import { buildPlane, CullState, ModelBuilder, Texture, createDevice, DepthState } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: '#canvas',
})

// Create a shader program with vertex and fragment shaders.
// Here the shader source code is grabbed from the script tags.
const program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

// Create a mesh which is going to be rendered
const geometry = ModelBuilder.begin().append(buildPlane).endMeshPart(device)

// The easiest way to create a texture is to pass the Image URL as an option to the constructor.
const texturesFromUrls = [
  device.createTexture({ data: '/assets/textures/prototype/proto_red.png' }),
  device.createTexture({ data: '/assets/textures/prototype/proto_green.png' }),
  device.createTexture({ data: '/assets/textures/prototype/proto_blue.png' }),
  device.createTexture({ data: '/assets/videos/big-buck-bunny.mp4' }),
]
// Video URLs work the same way. The video element is then available on the texture instance
// behind the `video` property. The video however wont start the playback automatically.
// Here we iterate over all textures created so far and find those which have a video element.
texturesFromUrls.forEach((texture) => {
  if (texture.video) {
    // And then add a callback to start the playback when the video is ready to play
    texture.video.oncanplay = () => {
      texture.video.volume = 0
      texture.video.play()
    }
  }
})

// The texture may also be created from an array buffer or plain array. Additionally to the `data`
// option the `width`, `height`, `pixelFormat` and the `pixelType` must be specified.
const texturesFromData: Texture[] = []
texturesFromData.push(device.createTexture({
  pixelFormat: 'RGBA',
  pixelType: 'uint8',
  data: {
    width: 2,
    height: 2,
    data: new Uint8ClampedArray([
      0xFF, 0x00, 0x00, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0x00, 0x00, 0xFF,
    ])
  },
}))
texturesFromData.push(device.createTexture({
  pixelFormat: 'RGBA',
  pixelType: 'uint8',
  data: {
    width: 2,
    height: 2,
    data: new Uint8ClampedArray([
      0x00, 0xFF, 0x00, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF,
      0x00, 0xFF, 0x00, 0xFF,
    ]),
  }
}))
texturesFromData.push(device.createTexture({
  pixelFormat: 'RGBA',
  pixelType: 'uint8',
  data: {
    width: 2,
    height: 2,
    data: new Uint8ClampedArray([
      0x00, 0x00, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF,
      0x00, 0x00, 0xFF, 0xFF,
    ]),
  }
}))
texturesFromData.push(device.createTexture({
  pixelFormat: 'RGBA',
  pixelType: 'uint8',
  data: {
    width: 2,
    height: 2,
    data: new Uint8ClampedArray([
      0x00, 0x00, 0x00, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF,
      0xFF, 0xFF, 0xFF, 0xFF,
      0x00, 0x00, 0x00, 0xFF,
    ]),
  }
}))

// Prepare some state variables
const world = Mat4.createRotationX(Math.PI * 0.5)
const view = Mat4.createIdentity()
const proj = Mat4.createIdentity()

// Begin the rendering loop
loop((time, dt) => {
  // prepare render state
  device.resize()
  device.clear(0xff2e2620, 1.0)
  device.depthState = DepthState.Default
  device.cullState = CullState.CullClockWise

  // update view and projection matrices
  view.initTranslation(0, 0, -1)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0, 100)

  // assign state to shader
  program.setUniform('view', view)
  program.setUniform('projection', proj)

  // render the same mesh once for every texture
  let rows = [
    texturesFromUrls,
    texturesFromData,
  ]
  for (let i = 0; i < rows.length; i++) {
    let cols = rows[i]
    for (let j = 0; j < cols.length; j++) {
      let texture = cols[j]

      world.setTranslation(
        -0.5 * cols.length + j + 0.5,
        +0.5 * rows.length - i - 0.5,
        -1,
      )

      program.setUniform('texture', texture)
      program.setUniform('world', world)

      geometry.draw(program)
    }
  }
})

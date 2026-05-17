import { Color, createDevice, Device } from '@gglib/graphics'
import { loop } from '@gglib/utils'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: 'webgl2' | 'webgpu' | 'auto') {
  // Create the graphics device and pass the existing canvas element from the DOM.
  const device: Device = await createDevice({ canvas, platform }).ready

  // Create a shader program with vertex and fragment shaders.
  // Here the shader source code is grabbed from the script tags.
  const shader = device.createShaderModule({
    wgsl: wgslShader,
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  // Create the vertex buffer
  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: {
          byteOffset: 0,
          elementCount: 3,
          elementType: 'float32',
          normalized: false,
          packed: false,
        },
        vTexture: {
          byteOffset: 12,
          elementCount: 2,
          elementType: 'float32',
          normalized: false,
          packed: false,
        },
      },
      // However, the data gets an additional vertex.
      // prettier-ignore
      data: new Float32Array([
        -0.5, -0.5, 0.0,   0,  1,
         0.5, -0.5, 0.0,   1,  1,
        -0.5,  0.5, 0.0,   0,  0,
         0.5,  0.5, 0.0,   1,  0,
      ]),
    },
  ])

  // Create the index buffer.
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    // The data array defines a triangle list. That means each 3 values
    // describe a triangle by indexing the vertices from the vertex buffer
    // prettier-ignore
    data: new Uint16Array([
      0, 2, 1, // first triangle
      1, 2, 3, // second triangle
    ]),
  })

  // Create a texture object. We simply pass an URL as `data` option.
  const texture = device.createTexture({
    source: '/textures/prototype/proto_red.png',
  })

  function frame() {
    device.resize()
    if (!shader.isReady) {
      return
    }
    const pass = device.renderPass

    // And assign the texture to the shader
    shader.program.set('uTexture', texture)

    // resize (if needed) and clear the screen
    pass.flush()
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    // set the drawing state
    pass.setProgram(shader.program)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)

    // and render.
    pass.drawIndexed(6)
    pass.submit()
  }
  // Begin render loop
  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  precision highp float;

  attribute vec3 vPosition;

  attribute vec2 vTexture;

  varying vec2 uv;

  void main(void) {
    uv = vTexture;
    gl_Position = vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  precision highp float;

  varying vec2 uv;
  uniform sampler2D uTexture;

  void main(void) {
    gl_FragColor = texture2D(uTexture, uv);
  }
`

const wgslShader = /*wgsl*/ `
  struct VertexInput {
    @location(0) vPosition : vec3<f32>,
    @location(1) vTexture : vec2<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) uv : vec2<f32>,
  };

  @group(0)
  @binding(0)
  var uTexture : texture_2d<f32>;

  @group(0)
  @binding(1)
  var defaultSampler : sampler;

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(input.vPosition, 1.0);
    output.uv = input.vTexture;
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(uTexture, defaultSampler, input.uv);
  }
`

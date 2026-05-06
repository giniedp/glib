import { Color, createDevice, Device, WebglDevice } from '@gglib/graphics'

const glslVS = /*glsl*/ `
  precision highp float;

  attribute vec3 vPosition;

  attribute vec3 vColor;

  varying vec3 vertexColor;

  void main(void) {
    vertexColor = vColor;
    gl_Position = vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  precision highp float;

  varying vec3 vertexColor;

  void main(void) {
    gl_FragColor = vec4(vertexColor.rgb, 1.0);
  }
`

const wgslShader = /*wgsl*/ `
  struct VertexInput {
    @location(0) vPosition : vec3<f32>,
    @location(1) vColor : vec3<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) vertexColor : vec3<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(input.vPosition, 1.0);
    output.vertexColor = input.vColor;
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(input.vertexColor, 1.0);
  }
`

export default async function run(canvas: HTMLCanvasElement, _: any, platform: 'webgl2' | 'webgpu' | 'auto') {
  const device: Device = await createDevice({ canvas, platform }).ready

  const shader = device.createShaderModule({
    wgsl: wgslShader,
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: {
          byteOffset: 0,
          elementCount: 3,
          elementType: 'float32',
        },
        vColor: {
          byteOffset: 12,
          elementCount: 3,
          elementType: 'float32',
        },
      },
      // However, the data gets an additional vertex.
      // prettier-ignore
      data: new Float32Array([
        -0.5, -0.5, 0.0,   1,  0,  0, // The red vertex
         0.5, -0.5, 0.0,   0,  1,  0, // The green vertex
        -0.5,  0.5, 0.0,   0,  0,  1, // The blue vertex
         0.5,  0.5, 0.0,   1,  1,  1, // The white vertex
      ]),
    },
  ])

  // Now create an index buffer. The `dataType` must be either `ushort` or an `uint`
  // which defines the element type of the `data` array.
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

  function frame() {
    device.resize()
    if (!shader.isReady) {
      return
    }
    const pass = device.renderPass

    pass.flush()
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    // Now prepare the device for rendering as before by
    // setting the program and the vertex buffer
    pass.setProgram(shader.program)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)
    pass.drawIndexed(6, 1, 0, 0)
    pass.submit()
  }
  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

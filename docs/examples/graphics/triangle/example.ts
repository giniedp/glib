import { Color, createDevice, Device, PlatformId } from '@gglib/graphics'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: PlatformId) {
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
          normalized: false,
          packed: false,
        },
      },
      // prettier-ignore
      data: new Float32Array([
        -0.5, -0.5, 0.0, // vertex 1
         0.5, -0.5, 0.0, // vertex 2
         0.0,  0.5, 0.0, // vertex 3
      ]),
    },
  ])

  const pass = device.renderPass
  function frame() {
    device.resize()

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isReady) {
      // wait for the program to compile
      return
    }

    pass.setVertexBuffer(vertices)
    pass.setProgram(shader.program)
    pass.setPrimitiveType('TriangleList')
    pass.draw(3)
    pass.submit()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 vPosition;
  void main(void) {
    gl_Position = vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`
const wgslShader = /*wgsl*/ `
  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
  };

  @vertex
  fn vs(
    @location(0) vPosition : vec3<f32>
  ) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(vPosition, 1.0);
    return output;
  }
  @fragment
  fn fs() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
  }
`

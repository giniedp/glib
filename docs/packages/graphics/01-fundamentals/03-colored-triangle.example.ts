import { Color, createDevice, Device, PlatformId } from '@gglib/graphics'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const shader = device.createShaderModule({
    wgsl: {
      source: wgslShader,
    },
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  // This time each vertex carries two attributes: a position and a color.
  // Both live in the same buffer, interleaved per vertex.
  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        // `vPosition` starts at byte 0 of each vertex...
        vPosition: {
          byteOffset: 0,
          elementCount: 3,
          elementType: 'float32',
        },
        // ...and `vColor` follows right after, at byte 12 (3 floats * 4 bytes).
        vColor: {
          byteOffset: 12,
          elementCount: 3,
          elementType: 'float32',
        },
      },
      // Each row below is one vertex: 3 floats for position, then 3 floats
      // for color (r, g, b). The layout above tells the GPU how to slice
      // this flat array back into the two attributes.
      // prettier-ignore
      data: new Float32Array([
        /* position */ -0.5, -0.5, 0.0, /* color */ 1, 0, 0,
        /* position */  0.5, -0.5, 0.0, /* color */ 0, 1, 0,
        /* position */  0.0,  0.5, 0.0, /* color */ 0, 0, 1,
      ]),
    },
  ])

  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    pass.setVertexBuffer(vertices)
    pass.setProgram(shader.program)
    pass.draw(3)
    pass.flush()
  }

  device.scheduler.add(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 vPosition;
  in vec3 vColor;
  // Passed on to the fragment shader. The GPU interpolates this value
  // across the triangle's surface, which is why the result looks smooth.
  out vec3 vertexColor;
  void main(void) {
    vertexColor = vColor;
    gl_Position = vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  in vec3 vertexColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(vertexColor, 1.0);
  }
`
const wgslShader = /*wgsl*/ `
  struct VertexInput {
    @location(0) vPosition : vec3<f32>,
    @location(1) vColor : vec3<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    // Interpolated across the triangle's surface for the fragment shader.
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

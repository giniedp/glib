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

  // A rectangle needs 4 corners, but 2 triangles share an edge - meaning 2
  // of the 4 corners would otherwise have to be duplicated in the vertex
  // buffer. An index buffer avoids that: vertices are listed once here...
  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: {
          elementType: 'float32',
          byteOffset: 0,
          elementCount: 3,
        },
        vColor: {
          byteOffset: 12,
          elementCount: 3,
          elementType: 'float32',
        },
      },
      // prettier-ignore
      data: new Float32Array([
        /* 0: bottom left  */ -1, -1, 0.0, 1.0, 0.0, 0.0,
        /* 1: bottom right */  1, -1, 0.0, 0.0, 1.0, 0.0,
        /* 2: top left     */ -1,  1, 0.0, 0.0, 0.0, 1.0,
        /* 3: top right    */  1,  1, 0.0, 1.0, 1.0, 1.0,
      ]),
    },
  ])

  // ...and then referenced by index, as many times as needed, to describe
  // the two triangles that make up the rectangle. `0, 2, 1` is the first
  // triangle (bottom left, top left, bottom right), `1, 2, 3` is the second
  // (bottom right, top left, top right) - together covering the full
  // rectangle without repeating any vertex data.
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([0, 2, 1, 1, 2, 3]),
  })

  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    pass.setProgram(shader.program)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)
    // `drawIndexed` walks the index buffer instead of the vertex buffer
    // directly. 6 indices are drawn - 2 triangles, 3 indices each.
    pass.drawIndexed(6)
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

import { Color, createDevice, CullState, Device, PlatformId } from '@gglib/graphics'
import { mountUi } from 'tweak-ui'

export default async function run(canvas: HTMLCanvasElement, tools: any, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform }).ready

  const shader = device.createShaderModule({
    wgsl: wgslShader,
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  const indices = device.createIndexBuffer({
    data: new Uint16Array([0, 1, 2, 0, 1, 3]),
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
          byteOffset: 3 * 4,
          elementCount: 3,
          elementType: 'float32',
          normalized: true,
        },
      },
      // prettier-ignore
      data: new Float32Array([
        -0.5, 0.0, 0.0, /* color: */ 1.0, 0.0, 0.0,  // vertex 0
        +0.5, 0.0, 0.0, /* color: */ 0.0, 1.0, 0.0,  // vertex 1
         0.0, 0.5, 0.0, /* color: */ 0.0, 0.0, 0.0,  // vertex 2
         0.0,-0.5, 0.0, /* color: */ 1.0, 1.0, 1.0,  // vertex 3
      ]),
    },
  ])

  const object = {
    state: CullState.Disabled,
  }
  const pass = device.renderPass
  function frame() {
    device.resize()

    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isReady) {
      // wait for the program to compile
      return
    }

    pass.setIndexBuffer(indices)
    pass.setVertexBuffer(vertices)
    pass.setProgram(shader.program)
    pass.setCullState(object.state)
    pass.setPrimitiveType('TriangleList')
    pass.drawIndexed(indices.elementCount)
    pass.submit()
    pass.flush()
  }

  mountUi(tools, (ui) => {
    ui.select(object, 'state', {
      options: [
        { value: CullState.Disabled, label: 'Disabled' },
        { value: CullState.CullFront, label: 'Cull Front' },
        { value: CullState.CullBack, label: 'Coll Back' },
      ],
    })
  })
  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 vPosition;
  in vec3 vColor;
  out vec3 fColor;
  void main(void) {
    gl_Position = vec4(vPosition, 1.0);
    fColor = vColor;
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  in vec3 fColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(fColor, 1.0);
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

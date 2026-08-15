import { BlendState, Color, createDevice, Device, PlatformId } from '@gglib/graphics'
import { Mat4, vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const settings = {
  blend: BlendState.Alpha,
  alpha: 0.6,
}

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
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

  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: { byteOffset: 0, elementCount: 3, elementType: 'float32' },
      },
      // prettier-ignore
      data: new Float32Array([
        -0.4, -0.4, 0.0,
         0.4, -0.4, 0.0,
        -0.4,  0.4, 0.0,
         0.4,  0.4, 0.0,
      ]),
    },
  ])
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([0, 2, 1, 1, 2, 3]),
  })

  const quadA = {
    world: Mat4.createTranslation(vec3(-0.2, -0.1, 0)),
    color: Color.Red.toVec4(),
    program: shader.program.clone(),
  }
  const quadB = {
    world: Mat4.createTranslation(vec3(0.2, 0.1, 0)),
    color: Color.LimeGreen.toVec4(),
    program: shader.program.clone(),
  }

  mountUi(tools, (ui) => {
    ui.select(settings, 'blend', {
      options: [
        { value: BlendState.Disabled, label: 'Disabled' },
        { value: BlendState.Alpha, label: 'Alpha' },
        { value: BlendState.Additive, label: 'Additive' },
        { value: BlendState.Multiply, label: 'Multiply' },
      ],
    })
    ui.scalar(settings, 'alpha', { range: true, min: 0, max: 1, step: 0.01 })
  })

  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    // The blend state decides how a pixel being drawn is combined with the
    // pixel already in the render target - it does not change what colors
    // the shader outputs, only how they are merged afterwards.
    pass.setRenderBlend(0, settings.blend)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)

    for (const quad of [quadA, quadB]) {
      const program = quad.program
      quad.color.w = settings.alpha
      program.set('uWorld', quad.world)
      program.set('uColor', quad.color)
      program.commit()

      pass.setProgram(program)
      pass.drawIndexed(6)
    }

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
  uniform mat4 uWorld;
  void main(void) {
    gl_Position = uWorld * vec4(vPosition, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  uniform vec4 uColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = uColor;
  }
`
const wgslShader = /*wgsl*/ `
  @group(0) @binding(0) var<uniform> uWorld : mat4x4<f32>;
  @group(0) @binding(1) var<uniform> uColor : vec4<f32>;

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
  };

  @vertex
  fn vs(@location(0) vPosition : vec3<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = uWorld * vec4<f32>(vPosition, 1.0);
    return output;
  }

  @fragment
  fn fs() -> @location(0) vec4<f32> {
    return uColor;
  }
`

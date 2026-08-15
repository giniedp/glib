import { Color, createDevice, DepthState, Device, PlatformId, Texture } from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const settings = {
  depthEnabled: true,
  drawNearFirst: true,
}

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const shader = device.createShaderModule({
    wgsl: { source: wgslShader },
    glsl: { vertex: glslVS, fragment: glslFS },
  })

  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        position: { byteOffset: 0, elementCount: 3, elementType: 'float32' },
      },
      // prettier-ignore
      data: new Float32Array([
        -0.5, -0.5, 0.0,
         0.5, -0.5, 0.0,
        -0.5,  0.5, 0.0,
         0.5,  0.5, 0.0,
      ]),
    },
  ])
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([0, 2, 1, 1, 2, 3]),
  })

  // Two quads, overlapping on screen but at different distances from the
  // camera: the red one is closer, the blue one is further away.
  // Each object needs it's own shader program copy
  const nearQuad = {
    program: shader.program.clone(),
    world: Mat4.createTranslationXYZ(-0.4, 0, 0.4),
    color: Color.Red,
  }
  const farQuad = {
    program: shader.program.clone(),
    world: Mat4.createTranslationXYZ(0.4, 0, -0.4),
    color: Color.Blue,
  }

  mountUi(tools, (ui) => {
    ui.bool(settings, 'depthEnabled', { label: 'Depth Test' })
    ui.bool(settings, 'drawNearFirst', { label: 'Draw Near Quad First' })
  })

  const depthTarget: Texture = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })
  const renderTarget: Texture = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })

  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 0, 2)

  const pass = device.renderPass
  function frame() {
    device.resize()
    depthTarget.resizeToMatch(device.output)
    renderTarget.resizeToMatch(device.output)

    view.initTranslation(cameraPosition).invert()
    projection.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    pass.setRenderTarget(0, renderTarget, 0, 0, device.output)
    if (settings.depthEnabled) {
      pass.setDepthTarget(depthTarget)
    }
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearDepth(1)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    // Without depth testing, whichever quad is drawn *last* wins - even if
    // it is actually the one further from the camera. With depth testing
    // enabled, the GPU compares each pixel's distance against what is
    // already in the depth buffer and keeps only the nearer one,
    // regardless of draw order.
    pass.setDepthState(settings.depthEnabled ? DepthState.LessEqual : DepthState.Disabled)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)

    const order = settings.drawNearFirst ? [nearQuad, farQuad] : [farQuad, nearQuad]
    for (const quad of order) {
      const program = quad.program
      program.set('uView', view)
      program.set('uProjection', projection)
      program.set('uWorld', quad.world)
      program.set('uColor', quad.color)
      program.commit()

      pass.setProgram(program)
      pass.drawIndexed(6)
    }

    pass.submit()
    pass.resolve()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 position;
  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;
  void main(void) {
    gl_Position = uProjection * uView * uWorld * vec4(position, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  uniform vec3 uColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(uColor, 1.0);
  }
`
const wgslShader = /*wgsl*/ `
  @group(0) @binding(0) var<uniform> uWorld : mat4x4<f32>;
  @group(0) @binding(1) var<uniform> uView : mat4x4<f32>;
  @group(0) @binding(2) var<uniform> uProjection : mat4x4<f32>;
  @group(0) @binding(3) var<uniform> uColor : vec3<f32>;

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
  };

  @vertex
  fn vs(@location(0) position : vec3<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = uProjection * uView * uWorld * vec4<f32>(position, 1.0);
    return output;
  }

  @fragment
  fn fs() -> @location(0) vec4<f32> {
    return vec4<f32>(uColor, 1.0);
  }
`

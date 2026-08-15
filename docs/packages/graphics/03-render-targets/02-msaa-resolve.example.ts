import {
  boxGeometry,
  Color,
  createDevice,
  CullState,
  DepthState,
  Device,
  PlatformId,
  TaskContext,
  Texture,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform }).ready

  const shader = device.createShaderModule({
    wgsl: { source: wgsl },
    glsl: { vertex: glslVS, fragment: glslFS },
  })

  const cube = boxGeometry(device)

  const settings = { msaa: true }
  mountUi(tools, (ui) => {
    ui.bool(settings, 'msaa', { label: 'MSAA (4 samples)' })
  })

  // A multisampled render target - and a matching multisampled depth
  // target, sample counts have to agree - to render into instead of the
  // canvas directly. Both are resized to track the canvas every frame.
  const msaaColor: Texture = device.createRenderTarget({
    width: device.output.width,
    height: device.output.height,
    format: device.output.format,
    sampleCount: 4,
  })
  const msaaDepth: Texture = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
    sampleCount: 4,
  })
  const plainDepth: Texture = device.createDepthTarget({
    width: device.output.width,
    height: device.output.height,
    format: 'DEPTH24_PLUS',
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 0.6, 3)

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    device.resize()
    msaaColor.resizeToMatch(device.output)
    msaaDepth.resizeToMatch(device.output)
    plainDepth.resizeToMatch(device.output)

    world.initIdentity().rotateY((ctx.time / 1000) * 20 * DEGREE_TO_RAD)
    view.initLookAt(cameraPosition, Vec3.create(0, 0, 0), Vec3.create(0, 1, 0)).invert()
    projection.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    if (settings.msaa) {
      // Render into the multisampled target, `device.output` given as the
      // resolve target - `pass.resolve()` below downsamples the 4 samples
      // per pixel into the single-sampled canvas image.
      pass.setRenderTarget(0, msaaColor, 0, 0, device.output)
      pass.setDepthTarget(msaaDepth)
    } else {
      pass.setRenderTarget(0, null)
      // pass.setDepthTarget(plainDepth)
    }
    pass.setViewportState(0, 0, device.output.width, device.output.height)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.setClearDepth(1)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    const program = shader.program
    program.set('uWorld', world)
    program.set('uView', view)
    program.set('uProjection', projection)
    program.commit()

    pass.setDepthState(DepthState.LessEqual)
    pass.setCullState(CullState.CullBack)
    pass.setProgram(program)
    pass.render(cube)

    pass.submit()
    if (settings.msaa) {
      pass.resolve()
    }
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
  out vec3 color;
  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;

  void main(void) {
    color = position + vec3(0.5);
    gl_Position = uProjection * uView * uWorld * vec4(position, 1.0);
  }
`
const glslFS = /*glsl*/ `
  #version 300 es
  precision highp float;
  in vec3 color;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(color, 1.0);
  }
`

const wgsl = /*wgsl*/ `

  @group(0) @binding(0) var<uniform> uWorld : mat4x4f;
  @group(0) @binding(1) var<uniform> uView : mat4x4f;
  @group(0) @binding(2) var<uniform> uProjection : mat4x4f;

  struct VertexInput {
    @location(0) position : vec3f,
  };
  struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) color : vec3f,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.color = input.position + vec3f(0.5);
    output.Position = uProjection * uView * uWorld * vec4f(input.position, 1.0);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return vec4f(input.color, 1.0);
  }
`

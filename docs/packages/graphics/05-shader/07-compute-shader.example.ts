import {
  bufferField,
  bufferLayout,
  bufferRecorder,
  BufferUsage,
  Color,
  createDevice,
  Device,
  FrameContext,
  PlatformId,
  shaderConstants,
  WebGpuDevice,
} from '@gglib/graphics'
import { lerp } from '@gglib/math'

const WORKGROUP_SIZE = 64
export default async (canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const shader = device.createShaderModule({
    wgsl: { source: wgslRender },
    glsl: null!, // not supported
  })

  const compute = device.createShaderModule({
    wgsl: {
      source: wgslCompute,
      computeConstants: shaderConstants({ WORKGROUP_SIZE }),
    },
    glsl: null!, // not supported
  })

  const numBodies = 4096
  // prettier-ignore
  const layout = bufferLayout([
    bufferField('position', 'vec2f'),
    bufferField('velocity', 'vec2f'),
  ])
  let verticesIn = device.createVertexBuffer([
    {
      size: numBodies * layout.byteSize,
      usage: BufferUsage.STORAGE | BufferUsage.VERTEX,
      layout: layout.attributes,
    },
  ])
  let verticesOut = device.createVertexBuffer([
    {
      size: numBodies * layout.byteSize,
      usage: BufferUsage.STORAGE | BufferUsage.VERTEX,
      layout: layout.attributes,
    },
  ])
  const writer = bufferRecorder({
    capacity: numBodies,
    recordByteSize: layout.byteSize,
  })

  for (let i = 0; i < numBodies; i++) {
    writer.seek(i)
    const r = lerp(0.1, 0.9, Math.random())
    const a = Math.random() * Math.PI * 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r * 0.6
    const speed = Math.sqrt(1.0 / (r + 0.05)) * 0.18

    writer.writeFloat32x2(x, y)
    writer.writeFloat32x2(-Math.sin(a) * speed, Math.cos(a) * speed * 0.6)
  }
  writer.upload(verticesIn.buffers[0])

  function computeFrame(ctx: FrameContext) {
    const pass = (device as WebGpuDevice).computePass
    if (!compute.isValid) {
      return
    }

    compute.program.mustSet('params.dt', ctx.delta)
    compute.program.mustSet('params.count', numBodies)
    compute.program.mustGet('bodiesIn').setBuffer(verticesIn.buffers[0])
    compute.program.mustGet('bodiesOut').setBuffer(verticesOut.buffers[0])
    compute.program.commit()

    pass.setProgram(compute.program)
    pass.dispatch(Math.ceil(numBodies / WORKGROUP_SIZE))
    pass.submit()
    pass.flush()
  }

  function renderFrame(ctx: FrameContext) {
    const pass = device.renderPass
    pass.setClearColor(0, Color.Black)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    pass.setPrimitiveType('PointList')
    pass.setVertexBuffer(verticesOut)
    pass.setProgram(shader.program)
    pass.draw(numBodies)

    pass.flush()
  }

  function frame(ctx: FrameContext) {
    computeFrame(ctx)
    renderFrame(ctx)
    ;[verticesIn, verticesOut] = [verticesOut, verticesIn]
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}

const wgslCompute = /* wgsl */ `
  override WORKGROUP_SIZE: u32 = 64;

  struct Body {
    pos: vec2f,
    vel: vec2f
  };

  struct Params {
    dt: f32,
    count: u32
  };

  @group(0) @binding(0) var<storage, read> bodiesIn: array<Body, 1>;
  @group(0) @binding(1) var<storage, read_write> bodiesOut: array<Body, 1>;
  @group(0) @binding(2) var<uniform> params: Params;

  const G: f32 = 0.00004;
  const SOFTEN: f32 = 0.2;

  @compute @workgroup_size(WORKGROUP_SIZE)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    let i = id.x;
    if (i >= params.count) {
      return;
    }

    let body = bodiesIn[i];
    var acc = vec2f(0.0, 0.0);

    for (var j: u32 = 0u; j < params.count; j = j + 1u) {
      if (j == i) {
        continue;
      }

      let other = bodiesIn[j];
      let d = other.pos - body.pos;
      let distSq = dot(d, d) + SOFTEN * SOFTEN;
      let invDist = inverseSqrt(distSq);
      acc = acc + d * (G * invDist * invDist * invDist);
    }

    var vel = (body.vel + acc * params.dt) * 0.9999;
    let pos = body.pos + vel * params.dt;

    bodiesOut[i] = Body(pos, vel);
  }
`

const wgslRender = /* wgsl */ `
  struct VertexInput {
    @location(0) position: vec2f,
    @location(1) velocity: vec2f
  }

  struct FragmentInput {
    @builtin(position) position: vec4f,
    @location(0) speed: f32
  }

  @vertex
  fn vs(in: VertexInput) -> FragmentInput {
    var out: FragmentInput;
    out.position = vec4f(in.position, 0.0, 1.0);
    out.speed = length(in.velocity);
    return out;
  }

  @fragment
  fn fs(in: FragmentInput) -> @location(0) vec4f {
    let s = clamp(in.speed * 6.0, 0.0, 1.0);

    return vec4f(1.0, s, s * 0.3, 1.0);
  }
`

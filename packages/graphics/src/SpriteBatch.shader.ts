import type { ShaderModuleOptions } from './resources'

export function spriteBatchShader(): ShaderModuleOptions {
  return {
    wgsl: SPRITE_BATCH_WGSL,
    glsl: {
      vertex: vertexShader,
      fragment: fragmentShader,
    },
  }
}

export const SPRITE_BATCH_WGSL: string = /* wgsl*/ `

  struct VSInput {
    @location(0) position: vec3<f32>,
    @location(1) aTransform0: vec4<f32>,
    @location(2) aTransform1: vec4<f32>,
    @location(3) aTransform2: vec4<f32>,
    @location(4) aTransform3: vec4<f32>,
    @location(5) aTexcoord: vec4<f32>,
    @location(6) aColor: vec4<f32>,
  };

  struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
  };

  struct FSOutput {
    @location(0) color: vec4<f32>,
  }

  struct Uniforms {
    viewProjection: mat4x4<f32>,
    toSrgb: u32,
  }

  @group(0) @binding(0) var<uniform> uniforms: Uniforms;
  @group(0) @binding(1) var textureMap: texture_2d<f32>;
  @group(0) @binding(2) var textureSampler: sampler;


  @vertex
  fn vsMain(input: VSInput) -> VSOutput {

    let position = vec4(input.position, 1);
    let world = mat4x4<f32>(
      input.aTransform0,
      input.aTransform1,
      input.aTransform2,
      input.aTransform3,
    );
    var out: VSOutput;
    out.uv = mix(input.aTexcoord.xy, input.aTexcoord.zw, position.xy + vec2(0.5));
    out.color = input.aColor;
    out.position = uniforms.viewProjection * world * position;
    return out;
  }

  @fragment
  fn fsMain(input: VSOutput) -> FSOutput {
    var out: FSOutput;
    out.color = textureSample(textureMap, textureSampler, input.uv) * input.color;
    if (uniforms.toSrgb == 1) {
      out.color = vec4(linearToSrgb(out.color.rgb), out.color.a);
    }
    return out;
  }

  fn linearToSrgb(c: vec3<f32>) -> vec3<f32> {
    let cutoff = vec3<f32>(0.0031308);
    return select( 12.92 * c, 1.055 * pow(c, vec3<f32>(1.0 / 2.4)) - 0.055, c > cutoff);
}
`

const vertexShader = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  layout(std140) uniform Uniforms {
    mat4 viewProjection;
    uint toSrgb;
  } uniforms;

  // Per-vertex attribute (static quad)
  layout(location = 0) in vec3 aPosition;

  // Per-instance attributes (divisor = 1)
  layout(location = 1) in vec4 aTransform0;
  layout(location = 2) in vec4 aTransform1;
  layout(location = 3) in vec4 aTransform2;
  layout(location = 4) in vec4 aTransform3;
  layout(location = 5) in vec4 aTexcoord;
  layout(location = 6) in vec4 aColor;

  out vec2 v_uv;
  out vec4 v_color;

  void main(void) {
    // vec4 position = vec4(
    //   float(gl_VertexID & 1) - 0.5,
    //   float((gl_VertexID >> 1) & 1) - 0.5,
    //   0.0,
    //   1.0
    // );

    vec4 position = vec4(aPosition, 1.0);
    mat4 world = mat4(
      aTransform0,
      aTransform1,
      aTransform2,
      aTransform3
    );

    v_uv = mix(aTexcoord.xy, aTexcoord.zw, aPosition.xy + vec2(0.5));
    v_color = aColor;
    gl_Position = uniforms.viewProjection * world * position;
  }
`

const fragmentShader = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  layout(std140) uniform Uniforms {
    mat4 viewProjection;
    uint toSrgb;
  } uniforms;

  uniform sampler2D textureMap;

  in vec2 v_uv;
  in vec4 v_color;

  out vec4 fragColor;

  void main()
  {
    fragColor = texture(textureMap, v_uv) * v_color;
    if (uniforms.toSrgb == 1u) {
      fragColor = vec4(pow(fragColor.rgb, vec3(1.0 / 2.2)), fragColor.a);
    }
  }
`

import { FULLSCREEN_WGSL_VS } from '../image/common.wgsl'

export const CUBEMAP_WGSL = /* wgsl */ `
  ${FULLSCREEN_WGSL_VS}
  const MATH_PI: f32 = 3.1415926535897932384626433832795;

  fn uvToXYZ(face: u32, uv: vec2f) -> vec3f {
    switch (face) {
      case 0: {
        return vec3f( 1.0, uv.y, -uv.x );
      }
      case 1: {
        return vec3f( -1.0, uv.y, uv.x );
      }
      case 2: {
        return vec3f( uv.x, -1.0, uv.y );
      }
      case 3: {
        return vec3f( uv.x, 1.0, -uv.y );
      }
      case 4: {
        return vec3f( uv.x, uv.y, 1.0 );
      }
      default: {
        return vec3f( -uv.x, uv.y, -1.0 );
      }
    }
  }

  fn dirToUV(dir: vec3f) -> vec2f {
    return vec2f(
      0.5 + 0.5 * atan2(dir.z, dir.x) / MATH_PI,
      1.0 - acos(dir.y) / MATH_PI
    );
  }

  fn panoramaToCubeMap(tex: texture_2d<f32>, samp: sampler, face: u32, texCoord: vec2f) -> vec3f {
    let texCoordNew = texCoord * 2.0 - 1.0;
    let direction = normalize(uvToXYZ(face, texCoordNew));
    let src = dirToUV(direction);

    return textureSample(tex, samp, src).rgb;
  }

  struct Uniforms {
    currentFace: u32,
  };

  // @alias colorMap
  @group(0) @binding(0) var colorMap: texture_2d<f32>;
  @group(0) @binding(1) var colorMapSampler: sampler;

  // @block params
  @group(1) @binding(0) var<uniform> params: Uniforms;

  @fragment
  fn fs(in: FragmentInput) -> @location(0) vec4f {
    let currentFace = in.instanceIndex;
    let color = panoramaToCubeMap(colorMap, colorMapSampler, currentFace, in.uv);
    return vec4f(color.rgb, 1.0);
  }
`

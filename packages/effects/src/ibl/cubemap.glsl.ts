export const CUBEMAP_GLSL = /* glsl */ `
  #version 300 es
  precision highp float;
  precision highp int;

  uniform sampler2D colorMap;
  // @block params
  layout(std140) uniform Uniforms {
    int currentFace;
  } params;

  #define MATH_PI 3.1415926535897932384626433832795

  vec3 uvToXYZ(int face, vec2 uv) {
    switch (face) {
      case 0:
        return vec3( 1.0, uv.y, -uv.x );
      case 1:
        return vec3( -1.0, uv.y, uv.x );
      case 2:
        return vec3( +uv.x, -1.0, +uv.y );
      case 3:
        return vec3( +uv.x, 1.0, -uv.y );
      case 4:
        return vec3( +uv.x, uv.y, 1.0 );
      default:
        return vec3( -uv.x, +uv.y, -1.0 );
    }
  }

  vec2 dirToUV(vec3 dir) {
    return vec2(
      0.5 + 0.5 * atan(dir.z, dir.x) / MATH_PI,
      1.0 - acos(dir.y) / MATH_PI
    );
  }

  vec3 panoramaToCubeMap(int face, vec2 texCoord) {
    vec2 texCoordNew = texCoord * 2.0 - 1.0;
    vec3 direction = normalize( uvToXYZ( face, texCoordNew ) );
    vec2 src = dirToUV( direction );

    return texture(colorMap, src).rgb;
  }

  in vec2 uv;
  out vec4 fragColor;

  void main() {
    fragColor = vec4(panoramaToCubeMap(params.currentFace, uv), 1.0);
  }
`

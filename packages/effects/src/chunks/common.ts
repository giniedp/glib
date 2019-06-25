import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * Adds common attributes uniforms varying and structs
 *
 * @public
 */
export const COMMON: ShaderChunkSet = Object.freeze({
  attributes: glsl`
    // @binding position
    // @remarks The vertex position attribute
    attribute vec3 aPosition;
  `,
  varyings: glsl`
    // @remarks vertex position in world space after vertex shader
    varying vec4 vWorldPosition;
  `,
  uniforms: glsl`
    // @binding World
    // @remarks The objects world transform
    uniform mat4 uWorld;
    // @binding View
    // @remarks The camera view transform
    uniform mat4 uView;
    // @binding Projection
    // @remarks The camera projection
    uniform mat4 uProjection;

    // @binding CameraDirection
    uniform vec3 uCameraDirection;
    // @binding CameraPosition
    uniform vec3 uCameraPosition;
  `,
  structs: glsl`
    struct SurfaceParams {
      vec4 Normal;   // xyz = normal, w = depth
      vec4 Diffuse;  // rgb = albedo, a = alpha
      vec4 Specular; // rgb = specular color, a = specular power
      vec3 Emission; // rgb = emission color, a = unused
      vec3 PBR;      // r = metallic, g = roughness, ba = unused
    };
  `,
  vs_position: glsl`
    #ifndef SKINNED
    vWorldPosition = uWorld * vec4(aPosition, 1.0);
    #endif
  `,
  vs_end: glsl`
    gl_Position = uProjection * uView * vWorldPosition;
  `,
  fs_start_before: glsl`
    SurfaceParams surface;
    vec4 color;
  `,
  fs_end_after: glsl`
    gl_FragColor = color;
  `,
})

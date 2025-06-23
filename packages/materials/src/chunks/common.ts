import { glsl, ShaderChunkSet } from '@gglib/graphics'

/**
 * Adds common attributes uniforms varying and structs
 *
 * @public
 */
export const COMMON: ShaderChunkSet = {
  precision: glsl`
    precision highp float;
    precision highp int;
  `,
  attributes: glsl`
    // @binding position
    // @remarks The vertex position attribute
    attribute vec3 aPosition;
  `,
  varyings: glsl`
    // @remarks vertex position in world space after vertex shader
    varying vec4 vPositionInWS;

    // @remarks vertex position in view space after vertex shader
    varying vec4 vPositionInVS;

    // @remarks vector from vertex to camera in world space
    varying vec3 vToEyeInWS;

    // @remarks the eye vector to pixel in tangent space
    varying vec3 vEyeTangent;
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

    // @binding ClipPlanes
    // @remarks
    //   x: near
    //   y: far
    //   z: logarithmic depth buffer coefficient: 2.0 / log2(farplane + 1.0)
    uniform vec3 uClipPlanes;
  `,

  structs: glsl`
    struct SurfaceParams {
      vec4 Normal;     // xyz = normal, w = depth
      vec4 BaseColor;  // rgb = albedo, a = alpha
      vec3 Specular;   // rgb = specular color
      vec3 Emission;   // rgb = emission color
      float Metallic;  // metallic factor
      float Roughness; // roughness factor
      float Ior;
    };
  `,

  vs_position: glsl`
    #ifndef SKINNED
    vPositionInWS = uWorld * vec4(aPosition, 1.0);
    vPositionInWS.xyz /= vPositionInWS.w;
    #endif
  `,

  vs_end: glsl`
    vPositionInVS = uView * vPositionInWS;
    gl_Position = uProjection * vPositionInVS;
    vToEyeInWS = normalize(uCameraPosition.xyz - vPositionInWS.xyz) ;
  `,

  fs_start_before: glsl`
    SurfaceParams surface;
    surface.BaseColor = vec4(1.0, 1.0, 1.0, 1.0);
    surface.Specular = vec3(1.0, 1.0, 1.0);
    surface.Emission = vec3(0.0, 0.0, 0.0);
    surface.Metallic = 1.0;
    surface.Roughness = 1.0;
    surface.Ior = 1.5;
    vec4 color;
  `,

  fs_frag_color_after: glsl`
    gl_FragColor = color;
  `,
}

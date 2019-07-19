import { ShaderChunkSet } from '../builder'
import { glsl } from '../glsl'

/**
 * @public
 */
export type ShadeFunctionPhong = 'shadePhong'

/**
 * @public
 */
export const FXC_SHADE_PHONG: ShaderChunkSet = Object.freeze({
  functions: glsl`
    highp vec3 shadePhong(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 V = shade.V;
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 I = shade.I;
      vec3 R = reflect(-L, N);

      float dotNL = dot(N, L);
      if (dotNL <= 0.0) {
        return vec3(0.0, 0.0, 0.0);
      }

      float dotRV = max(dot(R, V), 0.0);
      float Fr = pow(dotRV, surface.Specular.a);
      float Fd = dotNL;

      return (Fr * surface.Specular.rgb + Fd * surface.Diffuse.rgb) * I;
    }
  `,
})

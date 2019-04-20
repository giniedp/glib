import { glsl } from '../glsl'

export const SHADE_PHONG = Object.freeze({
  functions: glsl`
    highp vec3 shadePhong(
      inout ShadeParams shade,
      inout SurfaceParams surface
    ) {
      vec3 V = shade.V;
      vec3 N = surface.Normal.xyz;
      vec3 L = shade.L;
      vec3 I = shade.I;

      float Fr = pow(max(dot(reflect(-L, N), V), 0.0), surface.Specular.a);
      float Fd = max(dot(N, L), 0.0);

      return (Fr * surface.Specular.rgb + Fd * surface.Diffuse.rgb) * I;
    }
  `,
})

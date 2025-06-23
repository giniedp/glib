import { glsl, ShaderChunkSet } from '@gglib/graphics'

export interface MtlIndexOfRefractionDefs {
  /**
   * Adds a index of refraction uniform
   *
   * @remarks
   * - Adds `uniform float uIor`
   * - Binds as `IndexOfRefraction`
   * - Default is `1.5`
   */
  INDEX_OF_REFRACTION?: boolean
}

export const MTL_INDEX_OF_REFRACTION: ShaderChunkSet<MtlIndexOfRefractionDefs> = {
  defines: glsl`

  `,
  uniforms: glsl`
    #ifdef INDEX_OF_REFRACTION
    // @binding IndexOfRefraction
    // @default 1.5
    uniform float uIor;
    #endif
  `,

  fs_surface: glsl`
    #ifdef INDEX_OF_REFRACTION
    surface.Ior = uIor;
    #endif
  `,
}

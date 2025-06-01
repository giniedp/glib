// import { glsl, ShaderChunkSet } from '@gglib/graphics'

// /**
//  * Describes preprocessor definitions which control emissive color contribution.
//  *
//  * @public
//  */
// export interface MtlEnvironmentDefs {
//   /**
//    * Enables environment color from texture
//    */
//   ENVIRONMENT_MAP?: boolean
//   /**
//    * Enables environment color from cube texture
//    */
//   ENVIRONMENT_MAP_CUBE?: boolean
//   /**
//    * Allows to override the texture coordinates. Default is `vTexture.xy`.
//    */
//   ENVIRONMENT_MAP_UV?: string
// }

// /**
//  * Contributes environment lighting and mapping to the shader. See {@link MtlEnvironmentDefs}
//  * @public
//  */
// export const MTL_ENVIRONMENT: ShaderChunkSet<MtlEnvironmentDefs> = {
//   defines: glsl`
//     #if defined(ENVIRONMENT_MAP) || defined(ENVIRONMENT_MAP_CUBE)
//       #if !defined(V_TEXTURE) && !defined(V_TEXTURE1) && !defined(V_TEXTURE2)
//         #define V_TEXTURE
//       #endif

//       #ifndef ENVIRONMENT_MAP_UV
//         #define ENVIRONMENT_MAP_UV vTexture.xy
//       #endif
//     #endif
//   `,

//   uniforms: glsl`
//     #if defined(ENVIRONMENT_MAP_CUBE)
//     // @binding EnvironmentMap
//     uniform samplerCube uEnvironmentMap;
//     #elif defined(ENVIRONMENT_MAP)
//     // @binding EnvironmentMap
//     uniform sampler2D uEnvironmentMap;
//     #endif
//   `,

//   functions: glsl`
//     vec3 getIBLRadiance(const in vec3 viewDir, const in vec3 normal, const in float roughness) {
//       #ifdef ENVIRONMENT_MAP

//         vec3 reflectVec = reflect( - viewDir, normal );

//         reflectVec = normalize(mix( reflectVec, normal, roughness * roughness));
//         reflectVec = normalize((vec4(reflectVec, 0.0) * uView).xyz);

//         vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );

//         return envMapColor.rgb * envMapIntensity;

//       #else
//         return vec3( 0.0 );
//       #endif
//     }
//     #ifdef ENVIRONMENT_MAP


//     vec2 getEmissionMapUV() {
//       #ifdef ENVIRONMENT_MAP_SCALE_OFFSET
//       return ENVIRONMENT_MAP_UV * uEmissionMapScaleOffset.xy + uEmissionMapScaleOffset.zw;
//       #else
//       return ENVIRONMENT_MAP_UV;
//       #endif
//     }
//     #endif
//   `,

//   fs_surface: glsl`
//     #if defined(ENVIRONMENT_MAP)
//     surface.Emission.rgb = texture2D(uEmissionMap, getEmissionMapUV() + uvOffset).rgb;
//       #ifdef ENVIRONMENT_COLOR
//     surface.Emission.rgb *= uEmissionColor;
//       #endif

//     #elif defined(ENVIRONMENT_COLOR)
//     surface.Emission.rgb = uEmissionColor;
//     #endif
//   `,
// }

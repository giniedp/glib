import { glsl } from '../glsl'

export interface GbufferDefs {
  GBUFFER?: any
  GBUFFER1?: any
  GBUFFER2?: any
  GBUFFER3?: any
  GBUFFER4?: any
}

// /**
//  * Enables multiple render target rendering
//  *
//  * @remarks
//  * Uses the following defines
//  *
//  *  - `GBUFFER4`
//  *  - `GBUFFER3`
//  *  - `GBUFFER2`
//  *  - `GBUFFER1`
//  *  - `GBUFFER`
//  */
// export const GBUFFER = Object.freeze({
//   // extensions: glsl`
//   //   #extension GL_EXT_draw_buffers : require
//   // `,
//   defines: glsl`
//     #ifdef GBUFFER4
//       #define GBUFFER3
//       #define GBUFFER2
//       #define GBUFFER1
//     #endif
//     #ifdef GBUFFER3
//       #define GBUFFER2
//       #define GBUFFER1
//     #endif
//     #ifdef GBUFFER2
//       #define GBUFFER1
//     #endif
//     #ifdef GBUFFER1
//       #define GBUFFER
//     #endif
//   `,
//   fs_start: glsl`
//     #ifdef GBUFFER1
//     vec4 color0 = vec4(0);
//     #endif
//     #ifdef GBUFFER2
//     vec4 color1 = vec4(0);
//     #endif
//     #ifdef GBUFFER3
//     vec4 color2 = vec4(0);
//     #endif
//     #ifdef GBUFFER4
//     vec4 color3 = vec4(0);
//     #endif
//   `,
//   fs_end: glsl`
//     #ifdef GBUFFER1
//     gl_FragData[0] = color0;
//     #endif
//     #ifdef GBUFFER2
//     gl_FragData[1] = color1;
//     #endif
//     #ifdef GBUFFER3
//     gl_FragData[2] = color2;
//     #endif
//     #ifdef GBUFFER4
//     gl_FragData[3] = color3;
//     #endif
//   `,
// })

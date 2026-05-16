declare module '*.wgsl' {
  import type { WgslProgram } from '@gglib/graphics'
  const shader: {
    source: string
    program: WgslProgram
  }
  export default shader
}

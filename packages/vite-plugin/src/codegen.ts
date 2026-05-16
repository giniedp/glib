import type { WgslProgram } from '@gglib/graphics'

/**
 * Builds the virtual JS module string that Vite serves for a .wgsl import.
 *
 * Shape:
 *   import shader from './foo.wgsl'
 *   shader.source      // resolved WGSL source string (includes inlined)
 *   shader.program     // raw WgslProgram AST
 *
 * We'll extend this with derived reflection (bindings, entryPoints, etc.)
 * as the plugin grows.
 */
export function buildVirtualModule(source: string, program: WgslProgram): string {
  return [
    `const source = ${JSON.stringify(source)};`,
    `const program = ${JSON.stringify(program)};`,
    `export default { source, program };`,
  ].join('\n')
}

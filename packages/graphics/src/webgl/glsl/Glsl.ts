import { formatError } from './formatError'
import { inspect, inspectProgram } from './inspect'
import { preprocess } from './preprocess'
import { scan } from './scan'
import { tokenize } from './tokenize'
export type { GlslMemberInfo, GlslProgramInspection, GlslShaderInspection } from './inspect'
export type { GlslScanResult } from './scan'
export { GlslTokenKind } from './tokenize'
export type { GlslDirective, GlslNode } from './tokenize'

export const Glsl = Object.freeze({
  formatError: formatError,
  preprocess: preprocess,
  scan: scan,
  tokenize: tokenize,
  inspect: inspect,
  inspectProgram: inspectProgram,
})

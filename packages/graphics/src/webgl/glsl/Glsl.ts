import { inspect, inspectProgram } from './inspect'
import { formatError } from './formatError'
import { preprocess } from './preprocess'
import { scan } from './scan'
import { tokenize } from './tokenize'

export { GlslMemberInfo, GlslProgramInspection, GlslShaderInspection } from './inspect'
export { GlslScanResult } from './scan'
export { GlslDirective, GlslNode, GlslTokenKind } from './tokenize'

export const Glsl = Object.freeze({
  formatError: formatError,
  preprocess: preprocess,
  scan: scan,
  tokenize: tokenize,
  inspect: inspect,
  inspectProgram: inspectProgram
})

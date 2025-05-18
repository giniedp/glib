import { RollupWarning, WarningHandler } from 'rollup'

const log = console
export function rollupIgnoreWarnings(codes: string[]) {
  return function(warning: RollupWarning, handle: WarningHandler) {
    if (!codes.includes(warning.code)) {
      log.warn(warning.message);
    }
  }
}

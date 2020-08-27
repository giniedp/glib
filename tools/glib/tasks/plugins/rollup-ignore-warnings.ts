import { RollupWarning, WarningHandler } from 'rollup'
import getLogger from 'webpack-log'

const log = getLogger({
  name: 'rollup',
  timestamp: true,
})
export function rollupIgnoreWarnings(codes: string[]) {
  return function(warning: RollupWarning, handle: WarningHandler) {
    if (!codes.includes(warning.code)) {
      log.warn(warning.message);
    }
  }
}

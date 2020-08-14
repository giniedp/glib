function bindConsoleFn<K extends keyof Console>(key: K): Console[K] {
  if (globalThis.console && key in console) {
    return console[key].bind(console)
  }
  return (): void => null
}

const EnabledLogger = {
  log: bindConsoleFn('log'),
  info: bindConsoleFn('info'),
  debug: bindConsoleFn('debug'),
  warn: bindConsoleFn('warn'),
  error: bindConsoleFn('error'),
  group: bindConsoleFn('group'),
  groupCollapsed: bindConsoleFn('groupCollapsed'),
  groupEnd: bindConsoleFn('groupEnd'),
}

const DisabledLogger: typeof EnabledLogger = {
  log: (): void => (void 0),
  info: (): void => (void 0),
  debug: (): void => (void 0),
  warn: (): void => (void 0),
  error: (): void => (void 0),
  group: (): void => (void 0),
  groupCollapsed: (): void => (void 0),
  groupEnd: (): void => (void 0),
}

/**
 * @public
 */
export const Log = {
  /**
   * Disables this logger. No log will be printed to console.
   */
  disable() {
    Object.assign(Log, DisabledLogger)
  },
  /**
   * Enables this logger. Logs will be printed to console
   */
  enable() {
    Object.assign(Log, EnabledLogger)
  },
  log: bindConsoleFn('log'),
  info: bindConsoleFn('info'),
  debug: bindConsoleFn('debug'),
  warn: bindConsoleFn('warn'),
  error: bindConsoleFn('error'),
  group: bindConsoleFn('group'),
  groupCollapsed: bindConsoleFn('groupCollapsed'),
  groupEnd: bindConsoleFn('groupEnd'),
  /**
   * Calls the function and automatically closes the log group after the result has been resolved
   */
  groupEndAsync: <T>(fn: () => T): Promise<T> => {
    let groupEnded = false
    return new Promise<T>(async (resolve, reject) => {
      Promise.resolve(fn()).then((result: T) => {
        if (!groupEnded) {
          groupEnded = true
          Log.groupEnd()
        }
        resolve(result)
      }).catch((err) => {
        if (!groupEnded) {
          groupEnded = true
          Log.groupEnd()
        }
        reject(err)
      })
    })
  }
}

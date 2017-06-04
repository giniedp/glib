  function consoleDelegate(name: string): (msg: any, ...text: any[]) => string {
    if (!console || !console[name]) {
      return (msg: any, ...text: any[]): string => {
        return ''
      }
    }
    // tslint:disable-next-line
    return function (msg: any, ...text: any[]): string {
      return console[name].apply(console, arguments)
    }
  }

  /**
   * Delegates the call to console.log if available
   */
  export let log = consoleDelegate('log')

  /**
   * Delegates the call to console.info if available
   */
  export let info = consoleDelegate('info')

  /**
   * Delegates the call to console.debug if available
   */
  export let debug = consoleDelegate('debug')

  /**
   * Delegates the call to console.warn if available
   */
  export let warn = consoleDelegate('warn')

  /**
   * Delegates the call to console.warn if available
   */
  export let error = consoleDelegate('error')

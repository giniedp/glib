module Glib.utils {
  let consoleDelegate = function (name:string):(msg:any, ...text:any[])=>string {
    if (!self.console || !self.console[name]) {
      return function (msg:any, ...text:any[]):string {
        return "";
      };
    }
    return function (msg:any, ...text:any[]):string {
      return self.console[name].apply(self.console, arguments);
    };
  };

  /**
   * Delegates the call to console.log if available
   */
  export let log = consoleDelegate('log');

  /**
   * Delegates the call to console.info if available
   */
  export let info = consoleDelegate('info');

  /**
   * Delegates the call to console.debug if available
   */
  export let debug = consoleDelegate('debug');

  /**
   * Delegates the call to console.warn if available
   */
  export let warn = consoleDelegate('warn');

  /**
   * Delegates the call to console.warn if available
   */
  export let error = consoleDelegate('error');
}

module Glib.utils {
  var consoleDelegate = function (name:string):(msg:any, ...text:any[])=>string {
    if (!window.console || !window.console[name]) {
      return function (msg:any, ...text:any[]):string {
        return "";
      };
    }
    return function (msg:any, ...text:any[]):string {
      return window.console[name].apply(window.console, arguments);
    };
  };

  /**
   * Delegates the call to console.log if available
   */
  export var log = consoleDelegate('log');

  /**
   * Delegates the call to console.info if available
   */
  export var info = consoleDelegate('info');

  /**
   * Delegates the call to console.debug if available
   */
  export var debug = consoleDelegate('debug');

  /**
   * Delegates the call to console.warn if available
   */
  export var warn = consoleDelegate('warn');

  /**
   * Delegates the call to console.warn if available
   */
  export var error = consoleDelegate('error');
}

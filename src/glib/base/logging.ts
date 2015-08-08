module Glib.utils {
  var consoleWrap = function (name:string):(msg:any, ...text:any[])=>string {
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
   * @method log
   */
  export var log = consoleWrap('log');

  /**
   * Delegates the call to console.info if available
   * @method info
   */
  export var info = consoleWrap('info');

  /**
   * Delegates the call to console.debug if available
   * @method debug
   */
  export var debug = consoleWrap('debug');

  /**
   * Delegates the call to console.warn if available
   * @method warn
   */
  export var warn = consoleWrap('warn');

  /**
   * Delegates the call to console.warn if available
   * @method error
   */
  export var error = consoleWrap('error');
}
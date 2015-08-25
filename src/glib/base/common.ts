module Glib.utils {

  /**
   * Generates a random uuid string
   */
  export function uuid():string{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16|0;
      var v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  /**
   * Picks entries from the given source object.
   */
  export function pick<T>(src:T):any {
    var i, key, result = {};
    for (i = 1; i < arguments.length; i += 1) {
      key = arguments[i];
      result[key] = src[key];
    }
    return result;
  }

  /**
   * Creates a shallow copy of an object, an array or a primitive.
   * Assumes that there are no proto properties for objects.
   * @method copy
   * @param {*} src Object to copy from.
   * @param {*} [dst] Object to copy into.
   * @return {*} The copied object
   */
  export function copy(src:any, dst?:any):any {
    if (Array.isArray(src)) {
      dst = dst || [];
      for (var i = 0; i < src.length; i++) {
        dst[i] = src[i];
      }
    } else if (src != null && typeof src === 'object') {
      dst = dst || {};
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    return dst;
  }
  
  /**
   * Extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
   * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
   * by passing an empty object as the target: `var object = Gin.extend({}, object1, object2)`.
   * Note: Keep in mind that `Gin.extend` does not support recursive merge (deep copy).
   * @method extend
   * @param {Object} dst Destination object.
   * @param {...Object} src Source object(s).
   * @return {Object} Reference to `dst`.
   */
  export function extend<T>(dst:T, ...srcRest:any[]):T {
    var length = arguments.length;
    if (length < 2 || dst == null) {
      return dst;
    }
    var i, src;
    for (i = 1; i < length; i += 1) {
      src = arguments[i];
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    return dst;
  }

  /**
   * Gets the current timestamp. Uses performance.now() if available.
   * @method getTime
   * @return {number}
   */
  export var getTime = (function(){
    if (window.performance && window.performance.now) {
      return function(){
        return window.performance.now();
      }
    } else if (window['mozAnimationStartTime']){
      return function(){
        return window['mozAnimationStartTime'];
      }
    } else {
      return function(){
        return new Date().getTime();
      }
    }
  }());

  var raf:any =
    window['requestAnimationFrame'] ||
    window['mozRequestAnimationFrame'] ||
    window['webkitRequestAnimationFrame'] ||
    window['msRequestAnimationFrame'];

  /**
   *
   * @method requestFrame
   */
  export var requestFrame = (function(){
    if (typeof raf === "function") {
      return function(callback) {
        raf(callback);
      }
    } else {
      return function(callback) {
        window.setTimeout(callback, 1);
      };
    }
  }());

  export var loop = function(loopLogic){
    var tick = function(){
      loopLogic();
      requestFrame(tick);
    };
    tick();
  };

  /**
   * Tests whether the given number is positive and is a power of two value
   * @method isPowerOfTwo
   * @param {number} value The number to test
   * @return {boolean}
   */
  export function isPowerOfTwo(value:number):boolean {
    return ((value > 0) && !(value & (value - 1)));
  }

  /**
   * @method lowerPowerOfTwo
   * @param value
   * @returns {number}
   */
  export function lowerPowerOfTwo(value:number):number {
    if (value <= 2) {
      throw "value must not be smaller than 2";
    }
    var i = 1;
    while (i < value) {
      i *= 2;
    }
    return i;
  }

  /**
   * @method higherPowerOfTwo
   * @param value
   * @returns {number}
   */
  export function higherPowerOfTwo(value:number):number {
    if (value <= 2) {
      return 2;
    }
    var i = 1;
    while (i <= value) {
      i *= 2;
    }
    return i;
  }

  /**
   * @method highestBit
   * @param value
   * @returns {number}
   */
  export function highestBit(value:number):number {
    if (value <= 0) {
      return -1;
    }

    var index = 0;
    var pow = 1;
    while (pow <= value) {
      pow *= 2;
      index += 1;
    }
    return index - 1;
  }

  export function trim(value:string):string {
    return value.replace(/(^\s*|\s*$)/g, '');
  }

  export function getLines(value:string):string[] {
    return value.replace(/\r\n/g, '\n').split('\n');
  }

  export function chompLeft(value:string, prefix:string):string {
    if (value.indexOf(prefix) === 0) {
      return value.slice(prefix.length);
    } else {
      return value;
    }
  }

  export function endsWith(value:string, suffix:string):boolean {
    return value.indexOf(suffix, value.length - suffix.length) !== -1;
  }

  export function isString(value:any):boolean {
    return typeof value === 'string';
  }

  export var isArray = Array.isArray;

  export function isObject(value:any):boolean {
    return value !== null && typeof value === 'object';
  }

}

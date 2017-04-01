module Glib.utils {

  /**
   * Generates a random uuid string
   */
  export function uuid():string{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16|0;
      let v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  /**
   * Picks properties from the given source object if they are not undefined
   */
  export function pick(src:any, k1?:string, k2?:string, k3?:string, k4?:string, k5?:string, k6?:string, k7?:string, k8?:string, k9?:string, k10?:string):any {
    let i, key, value, result = {};
    for (i = 1; i < arguments.length; i += 1) {
      key = arguments[i]
      value = src[key]
      if (value !== void 0) result[key] = value
    }
    return result
  }

  /**
   * Creates a copy of an object, an array or a primitive.
   * @method copy
   * @return {*} The copied object
   */
  export function copy(srcOrDeep:any, srcOrDest?:any, dest?:any):any {
    let deep = false;
    let src, dst;
    if (typeof srcOrDeep === "boolean") {
      deep = srcOrDeep;
      src = srcOrDest;
      dst = dest;
    } else {
      deep = false;
      src = srcOrDeep;
      dst = srcOrDest;
    }
    
    dst = Array.isArray(src) ? [] : {};
    
    let value, isArray, isObject;
    for (let key in src) {
      value = src[key];
      isArray = Array.isArray(value)
      isObject = value != null && typeof value === 'object'
      
      if (deep && value && (isArray || isObject)) {
        dst[key] = copy(deep, value);
      } else if (value !== void 0) {
        dst[key] = value;
      }
    }
    
    return dst;
  }
  
  /**
   * Extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
   * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
   * by passing an empty object as the target: `let object = Gin.extend({}, object1, object2)`.
   * Note: Keep in mind that `Gin.extend` does not support recursive merge (deep copy).
   * @method extend
   * @param {Object} dst Destination object.
   * @param {...Object} src Source object(s).
   * @return {Object} Reference to `dst`.
   */
  export function extend<T>(dst: T, a: any, b?: any, c?: any, d?: any, e?: any, f?: any): T {
    let length = arguments.length;
    if (length < 2 || dst == null) {
      return dst;
    }
    let i, src;
    for (i = 1; i < length; i += 1) {
      src = arguments[i];
      for (let key in src) {
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
  export let getTime = (function(){
    if (self.performance && self.performance.now) {
      return function(){
        return self.performance.now();
      }
    } else if (self['mozAnimationStartTime']){
      return function(){
        return self['mozAnimationStartTime'];
      }
    } else {
      return function(){
        return new Date().getTime();
      }
    }
  }());

  let raf:any =
    self['requestAnimationFrame'] ||
    self['mozRequestAnimationFrame'] ||
    self['webkitRequestAnimationFrame'] ||
    self['msRequestAnimationFrame'];

  /**
   *
   * @method requestFrame
   */
  export let requestFrame = (function(){
    if (typeof raf === "function") {
      return function(callback) {
        raf(callback);
      }
    } else {
      return function(callback) {
        self.setTimeout(callback, 1);
      };
    }
  }());

  export interface ILoop {
    kill():void
    (): void 
  }
  export let loop = function(loopFunc): ILoop {
    let time = getTime()
    let tick:any = function(){
      if (!tick) return 
      let now = getTime()
      let dt = now - time
      time = now;
      loopFunc(dt);
      if (!tick) return
      requestFrame(tick);
      return tick;
    };
    tick.kill = function() { tick = null; }
    return tick();
  };


  let docHidden, docVisibilityChange, docVisibilityState; 
  if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
    docHidden = "hidden"
    docVisibilityState = "visibilityState"
    docVisibilityChange = "visibilitychange"
  } else if (typeof document['mozHidden'] !== "undefined") {
    docHidden = "mozHidden"
    docVisibilityState = "mozVisibilityState"
    docVisibilityChange = "mozvisibilitychange"
  } else if (typeof document["msHidden"] !== "undefined") {
    docHidden = "msHidden"
    docVisibilityState = "msVisibilityState"
    docVisibilityChange = "msvisibilitychange"
  } else if (typeof document['webkitHidden'] !== "undefined") {
    docHidden = "webkitHidden"
    docVisibilityState = "webkitVisibilityState"
    docVisibilityChange = "webkitvisibilitychange"
  }
  
  export function documentIsHidden(): boolean {
    return document[docHidden]
  }
  export function documentVisibilityState(fallback?:string): string {
    return document[docVisibilityState] || fallback;
  }
  export function onDocumentVisibilityChange(callback: EventListenerOrEventListenerObject) {
    document.addEventListener(docVisibilityChange, callback)
  }
  export function offDocumentVisibilityChange(callback: EventListenerOrEventListenerObject) {
    document.removeEventListener(docVisibilityChange, callback)
  }

  /**
   * Tests whether the given number is positive and is a power of two value
   * @method isPowerOfTwo
   * @param {number} value The number to test
   * @return {boolean}
   */
  export function isPowerOfTwo(value: number): boolean {
    return ((value > 0) && !(value & (value - 1)));
  }

  /**
   * @method lowerPowerOfTwo
   * @param value
   * @returns {number}
   */
  export function lowerPowerOfTwo(value: number): number {
    if (value <= 2) {
      throw "value must not be smaller than 2";
    }
    let i = 1;
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
  export function higherPowerOfTwo(value: number): number {
    if (value <= 2) {
      return 2;
    }
    let i = 1;
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
  export function highestBit(value: number): number {
    if (value <= 0) {
      return -1;
    }

    let index = 0;
    let pow = 1;
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
    return value.replace(/(\r\n)|\n/g, '\n').split('\n');
  }

  export function chompLeft(value:string, prefix:string):string {
    if (value.indexOf(prefix) === 0) {
      return value.slice(prefix.length);
    } else {
      return value;
    }
  }

  export function endsWith(value:string, suffix:string): boolean {
    return value.indexOf(suffix, value.length - suffix.length) !== -1;
  }

  export function isString(value:any): boolean {
    return typeof value === 'string';
  }

  export let isArray = Array.isArray;

  export function isObject(value:any): boolean {
    return value !== null && typeof value === 'object';
  }


  let canvas = null;

  export function getImageData(image:HTMLImageElement, width?: number, height?: number){
    if (!image.complete){
      throw 'image must be completed';
    }
    canvas = canvas || document.createElement('canvas');
    canvas.width = width || image.naturalWidth;
    canvas.height = height || image.naturalHeight;

    let ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imgData.data;
    let result = [];
    result.length = data.length / 4;
    for(let i = 0; i < result.length; i += 1){
      result[i] = data[i * 4];
    }
    return result;
  }
}

/**
 * @public
 */
export const Log = {
  l: console ? console.log.bind(console) : (message?: any, ...optionalParams: any[]): void => null, // tslint:disable-line: no-console
  i: console ? console.info.bind(console) : (message?: any, ...optionalParams: any[]): void => null, // tslint:disable-line: no-console
  d: console ? console.debug.bind(console) : (message?: any, ...optionalParams: any[]): void => null, // tslint:disable-line: no-console
  w: console ? console.warn.bind(console) : (message?: any, ...optionalParams: any[]): void => null,
  e: console ? console.error.bind(console) : (message?: any, ...optionalParams: any[]): void => null,
}

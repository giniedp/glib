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

export const Log = {
  l: consoleDelegate('log'),
  i: consoleDelegate('info'),
  d: consoleDelegate('debug'),
  w: consoleDelegate('warn'),
  e: consoleDelegate('error'),
}

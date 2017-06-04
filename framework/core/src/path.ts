// source: https://github.com/nodejs/node/blob/master/lib/path.js
const pathSplit = /^(\/?|[\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/
// source: http://blog.stevenlevithan.com/archives/parseuri
const options = {
  key: [
    'source',
    'protocol',
    'authority',
    'userInfo',
    'user',
    'password',
    'host',
    'port',
    'relative',
    'path',
    'directory',
    'file',
    'query',
    'anchor',
  ],
  q: {
    name: 'queryKey',
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
  },
  parser: {
    // tslint:disable
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    // tslint:enable
  },
}

export function parseUri(str: string, strict: boolean = true): any {
  let	o = options
  let m = o.parser[strict ? 'strict' : 'loose'].exec(str)
  let uri: any = {}
  let i = 14

  while (i--) {
    uri[o.key[i]] = m[i] || ''
  }

  uri[o.q.name] = {}
  uri[o.key[12]].replace(o.q.parser, ($0: string, $1: string, $2: string) => {
    if ($1) {
      uri[o.q.name][$1] = $2
    }
  })

  return uri
}

function normalizeArray(tokens: string[]) {
  let result = []
  for (const token of tokens) {
    if (!token || token === '.') { continue }
    if (token === '..') {
      result.pop()
    } else {
      result.push(token)
    }
  }
  return result
}

export function collapsePath(path: string) {
  let result = normalizeArray(path.split(/\//)).join('/')
  if (isAbsolute(path)) {
    result = `/${result}`
  }
  return result
}

export function isAbsolute(path: string) {
  return !!path && path[0] === '/'
}

export function hasProtocol(path: string) {
  return !!path && !!path.match(/^[a-zA-Z]+:\/\//i)
}

export function dir(path: string) {
  return parseUri(path).directory
}

export function basename(path: string) {
  return pathSplit.exec(path)[2]
}

export function ext(path: string) {
  return pathSplit.exec(path)[3]
}

export function merge(a: string, b: string) {
  if (hasProtocol(b)) {
    return b
  }

  let aUri = parseUri(a)
  let bUri = parseUri(b)
  let path = isAbsolute(b) ? b : aUri.directory + bUri.path
  path = collapsePath(path)

  let result = ''
  if (aUri.protocol) {
    result = aUri.protocol + '://'
  }
  if (aUri.authority) {
    result += aUri.authority
  }
  if (!isAbsolute(path)) {
    result += '/'
  }
  return result + path
}

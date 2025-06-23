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

function isAbsolute(path: string) {
  return !!path && path[0] === '/'
}

function hasProtocol(path: string) {
  return !!path && !!path.match(/^[a-zA-Z]+:/i)
}

function collapse(path: string) {
  const wasAbsolute = isAbsolute(path)
  const parts = []
  for (const token of path.split(/\//)) {
    if (!token || token === '.') {
      continue
    }
    if (token === '..') {
      parts.pop()
    } else {
      parts.push(token)
    }
  }
  let result = parts.join('/')
  if (wasAbsolute) {
    result = `/${result}`
  }
  return result
}

/**
 * @public
 */
export class Uri {
  /**
   * Parses a string and extracts all uri components
   */
  public static parse(path: string, strict: boolean = true) {
    let	o = options
    let m = o.parser[strict ? 'strict' : 'loose'].exec(path)
    let uri: any = new Uri()
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

  public static dir(path: string) {
    return Uri.parse(path).directory
  }

  public static file(path: string) {
    return pathSplit.exec(path)[2]
  }

  public static ext(path: string) {
    return pathSplit.exec(path)[3]
  }

  public static merge(parentUri: string, resourceUri: string, basePath?: string) {
    if (hasProtocol(resourceUri)) {
      return resourceUri
    }

    let parent = Uri.parse(parentUri)
    let resource = Uri.parse(resourceUri)
    let path = isAbsolute(resourceUri) ? resource.path : parent.directory + resource.path
    path = collapse(path)
    if (resource.query) {
      path += `?${resource.query}`
    }
    if (resource.anchor) {
      path += `#${resource.anchor}`
    }

    let result = basePath || ''
    if (!result) {
      if (parent.protocol) {
        result = parent.protocol + '://'
      }
      if (parent.authority) {
        result += parent.authority
      }
    }
    if (!isAbsolute(path)) {
      result += '/'
    }

    return result + path
  }

  public source: string
  public protocol: string
  public authority: string
  public userInfo: string
  public user: string
  public password: string
  public host: string
  public port: string
  public relative: string
  public path: string
  public directory: string
  public file: string
  public query: string
  public anchor: string
}

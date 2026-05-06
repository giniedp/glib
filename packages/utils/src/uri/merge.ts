import { parseUri } from './parse'

export function mergeUri(parentUri: string, resourceUri: string, base?: string) {
  if (hasProtocol(resourceUri)) {
    return resourceUri
  }

  let parent = parseUri(parentUri)
  let resource = parseUri(resourceUri)
  let path = isAbsolute(resourceUri) ? resource.pathname : parent.directory + resource.pathname
  path = collapse(path)
  if (resource.query) {
    path += `?${resource.query}`
  }
  if (resource.fragment) {
    path += `#${resource.fragment}`
  }

  let result = base || ''
  if (!result) {
    if (parent.protocol) {
      result = parent.protocol + '://'
    }
    if (parent.authority) {
      result += parent.authority
    }
  }
  if (!isAbsolute(path) && !result.endsWith('/')) {
    result += '/'
  }

  return result + path
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

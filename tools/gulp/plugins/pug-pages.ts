
import * as fs from 'fs'
import * as frontMatter from 'parser-front-matter'
import * as path from 'path'
import { Transform } from 'stream'
import * as vinyl from 'vinyl'

export interface PugPagesOptions {
  [key: string]: any
  cwd?: string
  pug?: any
  compileOptions?: any
}

function readData(base: string, dir: string, name: string) {
  const filePath = path.join(dir, name)
  const stats = (() => {
    try {
      return fs.lstatSync(filePath)
    } catch (e) {
      return null
    }
  })()

  if (!stats) {
    return null
  }
  if (stats.isDirectory()) {
    return readData(base, path.join(dir, name), 'index.pug')
  }
  if (!stats.isFile()) {
    return null
  }
  const content = fs.readFileSync(filePath)
  if (!content) {
    return null
  }
  const fm = frontMatter.parseSync({ contents: content })
  const result = fm.data
  result.aliases = result.aliases || []
  result.createdAt = result.createdAt || stats.ctime.toISOString()
  result.updatedAt = result.updatedAt || stats.mtime.toISOString()
  // result.expiresAt = result.expiresAt
  // result.publishAt = result.publishAt
  result.draft = result.draft || false
  result.description = result.description || ''
  result.keywords = result.keywords || []
  result.type = path.basename(dir)
  result.slug = result.slug || path.basename(name, path.extname(name))
  if (result.slug === 'index') {
    result.slug = ''
  }
  result.title = result.title || result.slug.replace(/-/g, ' ')
  result.linkTitle = result.linkTitle || result.title
  // result.weight = result.weight
  result.path = '/' + path.relative(base, path.join(dir, result.slug))
  result.original = path.join(dir, name)
  return {
    meta: fm.data,
    content: fm.content,
  }
}

function childrenOf(filePath: string, base: string) {
  const fileDir = path.dirname(filePath)
  const fileName = path.basename(filePath)

  return fs.readdirSync(fileDir)
    .filter((it) => it !== fileName)
    .map((it) => readData(base, fileDir, it))
    .map((it) => it ? it.meta : null)
    .filter((it) => it && !it.draft)
    .filter((it) => /\.pug$/.test(it.original))
    .sort((a, b) => {
      if (a.weight && !b.weight) {
        return -1
      }
      if (b.weight && !a.weight) {
        return 1
      }
      if (a.weight === b.weight) {
        return String(a.title).localeCompare(String(b.title))
      }
      return String(a.weight).localeCompare(String(b.weight))
    })
}

export function page(options: PugPagesOptions, file: any, enc: string, cb: any) {
  const fileDir = path.dirname(file.path)
  const fileName = path.basename(file.path)
  if (!/\.pug$/.test(file.path)) {
    cb(null, file)
    return
  }
  const data = readData(file.base, fileDir, fileName)
  if (!data || data.draft) {
    cb(null, file)
    return
  }

  const pug = options.pug || require('pug')
  const cwd = options.cwd || process.cwd()
  const compileOptions = options.compileOptions || {}
  const locals = typeof compileOptions.locals === 'function' ? compileOptions.locals(file.path) : compileOptions.locals || {}

  if (fileName === 'index.pug') {
    data.meta.children = childrenOf(file.path, file.base)
  }

  const template = pug.compile(data.content, {
    filename: file.path,
    basedir: cwd,
    doctype: 'html',
    pretty: true,
    ...compileOptions,
  })
  const content = template({
    ...locals,
    ...{
      meta: data.meta,
      childrenOf: (child) => {
        return childrenOf(child.original, file.base)
      },
    },
  })
  cb(null, new vinyl({
    cwd: file.cwd,
    base: file.base,
    path: path.join(file.base, data.meta.path, 'index.html'),
    contents: Buffer.from(content),
  }))
}

export default function pugPages(options: PugPagesOptions) {
  return new Transform({
    objectMode: true,
    transform: (file, encoding, cb) => page(options, file, encoding, cb),
    flush: (cb) => cb(),
  })
}

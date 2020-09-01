
import * as fs from 'fs'
import * as path from 'path'
import * as frontMatter from 'parser-front-matter'
import { Transform, TransformCallback } from 'stream'
import { default as File } from 'vinyl'
import * as Prism from 'prismjs'
import { transpileMd } from './transpile-md'

export interface PugPagesOptions {
  // [key: string]: any
  cwd?: string
  pug?: any
  compileOptions?: any
  augmentMetadata?: (data: PugPageMeta) => PugPageMeta
}

export interface PugPageMeta {
  aliases?: string[]
  createdAt?: string
  updatedAt?: string
  expiresAt?: string
  publishAt?: string
  draft?: boolean
  description?: string
  keywords?: string[]
  type?: string
  slug?: string
  title?: string
  linkTitle?: string
  weight?: string
  path?: string
  original?: string
  children?: PugPageMeta[]
  template?: string
  content?: string
}

interface ContentWithFrontmatter {
  content: string
  meta: PugPageMeta
}

function readFrontMatter(filePath: string, rootDir: string): ContentWithFrontmatter {
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
    return readFrontMatter(path.join(filePath, 'index.pug'), rootDir)
  }
  if (!stats.isFile()) {
    return null
  }
  const fileContent = fs.readFileSync(filePath)
  if (!fileContent) {
    return null
  }
  const fm = frontMatter.parseSync({ contents: fileContent })
  const meta = fm.data as PugPageMeta
  meta.aliases = meta.aliases || []
  meta.createdAt = meta.createdAt || stats.ctime.toISOString()
  meta.updatedAt = meta.updatedAt || stats.mtime.toISOString()
  // meta.expiresAt = meta.expiresAt
  // meta.publishAt = meta.publishAt
  meta.draft = meta.draft || false
  meta.description = meta.description || ''
  meta.keywords = meta.keywords || []
  // meta.type = path.basename(dirName)
  meta.slug = meta.slug || path.basename(filePath, path.extname(filePath))
  if (meta.slug === 'index') {
    meta.slug = ''
  }
  meta.title = meta.title || meta.slug.replace(/-/g, ' ')
  meta.linkTitle = meta.linkTitle || meta.title
  // meta.weight = meta.weight
  meta.path = '/' + path.relative(rootDir, path.join(path.dirname(filePath), meta.slug))
  meta.original = filePath
  if (meta.template) {
    meta.template = path.join(path.dirname(filePath), meta.template)
  }
  return { meta, content: fm.content }
}

function readChildren(filePath: string, rootDir: string) {
  const fileDir = path.dirname(filePath)
  const fileName = path.basename(filePath)
  return fs.readdirSync(fileDir)
    .filter((it) => it !== fileName)
    .map((it) => readFrontMatter(path.join(fileDir, it), rootDir)?.meta)
    .filter((it) => /\.pug/.test(it.original))
    .filter((it) => it && !it.draft)
    .sort((a, b) => String(a.weight || "").localeCompare(String(b.weight || "")))
}

export function pugPage(options: PugPagesOptions, file: File, enc: string, cb: TransformCallback) {
  const fileDir = path.dirname(file.path)
  const fileName = path.basename(file.path)
  const data = readFrontMatter(path.join(fileDir, fileName), file.base)
  const meta = options.augmentMetadata?.(data.meta)
  if (!meta || meta?.draft) {
    cb(null, file)
    return
  }
  let content: string
  if (/\.md$/.test(file.path) && meta.template) {
    content = handlePug({
      ...options,
      rootDir: file.base,
      templatePath: meta.template,
      meta: {
        ...meta,
        content: transpileMd(data.content)
      },
    })
  }
  if (/\.pug$/.test(file.path)) {
    content = handlePug({
      ...options,
      rootDir: file.base,
      templatePath: file.path,
      templateSource: data.content,
      meta: meta,
    })
  }
  if (!content) {
    cb(null, file)
    return
  }
  cb(null, new File({
    cwd: file.cwd,
    base: file.base,
    path: path.join(fileDir, path.basename(fileName, path.extname(fileName)) + '.html'),
    contents: Buffer.from(content),
  }))
}

interface HandlePugOptions extends PugPagesOptions {
  templatePath: string
  templateSource?: string
  rootDir: string
  meta: PugPageMeta
}
function handlePug(options: HandlePugOptions): string {
  const templatePath = options.templatePath
  const templateSource = options.templateSource ?? fs.readFileSync(templatePath)
  const metadata = options.meta
  const pug = options.pug || require('pug')
  const cwd = options.cwd || process.cwd()
  const compileOptions = options.compileOptions || {}
  const locals = {
    ...(typeof compileOptions.locals === 'function' ? compileOptions.locals(templatePath) : compileOptions.locals || {})
  }
  const template = pug.compile(templateSource, {
    doctype: 'html',
    pretty: true,
    basedir: cwd,
    ...compileOptions,
    filters: {
      highlight: prism,
      ...(compileOptions.filters || {}),
    },
    filename: templatePath,

  })
  return template({
    ...locals,
    ...{
      meta: metadata,
      children: () => {
        return readChildren(metadata.original, options.rootDir)
      },
      childrenOf: (child: PugPageMeta) => readChildren(child.original, options.rootDir),
    },
  })
}

export function pugPages(options: PugPagesOptions) {
  return new Transform({
    objectMode: true,
    transform: (file, encoding, cb) => pugPage(options, file, encoding, cb),
    flush: (cb) => cb(),
  })
}

function prism(source: string, options: string | { lang: string }) {
  let lang: string = typeof options === "string" ? options : options?.lang
  let grammar = Prism.languages[lang]
  if (!grammar) {
    require(`prismjs/components/prism-${lang}.js`)
    grammar = Prism.languages[lang]
  }
  return Prism.highlight(source, grammar, lang)
}

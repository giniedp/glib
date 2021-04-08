import * as path from 'path'
import Metalsmith from 'metalsmith'
import { MetalsmithFileMeta } from './ms-metadata'
import wplog from 'webpack-log'

const log = wplog({
  name: 'ms-pug',
  timestamp: true,
})

function isPugFile(filename: string) {
  return filename.endsWith('.pug')
}
function isPartial(filename: string) {
  return path.basename(filename)[0] === '_'
}

export type LocalsRecolver = (file: string, data: Record<string, any>, smith: Metalsmith) => Record<string, any>
export interface MetalsmithPugOptions {
  cwd?: string
  pug?: any
  locals?: Record<string, any> | LocalsRecolver
  compileOptions?: any
}

export default (options: MetalsmithPugOptions) => {
  const memo: Record<string, MetalsmithFileMeta> = {}
  return (files: Record<string, MetalsmithFileMeta>, smith: Metalsmith, done: Function) => {
    Object.assign(memo, files)
    Object.keys(files)
      .filter(isPugFile)
      .filter((file) => {
        if (!isPartial(file)) return true
        delete files[file]
      })
      .forEach((file) => {
        try {
          const content = compile(options, file, memo, smith)
          files[file].contents = Buffer.from(content)
          files[file.replace(/\.pug$/, '.html')] = files[file]
        } catch (e) {
          log.error(e)
        }
        delete files[file]
      })

    done()
  }
}

function compile(
  config: MetalsmithPugOptions,
  file: string,
  files: Record<string, MetalsmithFileMeta>,
  smith: Metalsmith,
): string {
  const data = files[file]
  const pug = config.pug || require('pug')
  const cOpts = config.compileOptions || {}
  const template = pug.compile(data.contents.toString(), {
    doctype: 'html',
    pretty: true,
    basedir: config.cwd || smith.source(),
    ...cOpts,
    filename: path.join(smith.source(), file),
  })
  const locals = (typeof config.locals === 'function' ? config.locals(file, data, smith) : config.locals) || {}
  return template({
    meta: data,
    children: (file: string, opt: { deep: boolean; ext: string[] }) => childrenOf(file, files, opt),
    ...locals,
  })
}

function childrenOf(
  file: string,
  files: Record<string, MetalsmithFileMeta>,
  { deep, ext }: { deep?: boolean; ext?: string[] } = {},
) {
  const dirname = path.dirname(file) + path.sep
  const result = Object.keys(files)
    .filter((it) => it.startsWith(dirname))
    .filter((it) => !ext || ext.includes(files[it].fileExt))
    .filter((it) => {
      const rest = it.substring(dirname.length)
      const dir = path.dirname(rest)
      return dir && dir !== '.' && !dir.includes(path.sep)
    })
    .map((it) => files[it])
    .sort((a, b) => (a.weight < b.weight ? -1 : a.weight > b.weight ? 1 : 0))

  if (deep) {
    result.forEach((f) => {
      f.children = childrenOf(f.file, files, { deep, ext })
    })
  }
  return result
}

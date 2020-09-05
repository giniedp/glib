
import * as fs from 'fs'
import * as path from 'path'
import globby from 'globby'
import through from 'through-gulp'
import File from 'vinyl'
import type { Transform } from 'stream'

function parseConstants(glob: string | string[]) {
  const result = {}
  globby.sync(glob).forEach((path) => {
    fs
      .readFileSync(path, { encoding: 'utf-8' })
      .toString()
      .replace(/\r\n/g, '\n')
      .split('\n')
      .forEach((line) => {
        const match = line.match(/^\s*const\s+GLenum\s+(.+)\s+\s*=\s*(.+)\s*;/)
        if (match) {
          const name = match[1].trim()
          const value = match[2]
          result[name] = value;
        }
      })
  })
  return result
}

function processConstants(node: { [k: string]: string }) {
  const buffer = []
  buffer.push(`/**\n`)
  buffer.push(` * @public\n`)
  buffer.push(` */\n`)
  buffer.push(`export const enum GLConst {\n`)
  Object.entries(node).forEach(([k, v]) => {
    buffer.push(`  ${k} = ${v},\n`)
  })
  buffer.push(`}\n`)
  return buffer.join('')
}

function dereference(node, data) {
  return Object.keys(node.values).map((key) => {
    let value = node.values[key]
    let glName = null
    if (typeof value === 'string' && value.indexOf('gl:') >= 0) {
      glName = value.split(':')[1] || data.aliases[key]
      value = `gl.${glName}`
    }

    return {
      name: key,
      value: value,
      glName: glName || data.aliases[key]
    }
  })
}

function processTypemap(name: string, data) {
  const node = data[name]
  const values = dereference(node, data)

  const buffer = []

  buffer.push(`/**\n`)
  buffer.push(` * @public\n`)
  buffer.push(` */\n`)
  buffer.push(`export const ${name} = Object.freeze({\n`)
  values.forEach((it) => {
    buffer.push(`  ${it.name}: ${it.value},\n`)
    if (node.aliases && it.name !== it.glName && it.glName != null) {
      buffer.push(`  ${it.glName}: ${it.value},\n`)
    }
    if (it.glName != null) {
      buffer.push(`  [gl.${it.glName}]: ${it.value},\n`)
    }
  })
  buffer.push(`})\n`)

  return buffer.join('')
}

function processSize(name: string, data) {
  const node = data[name]
  const values = dereference(node, data)

  const buffer = []

  buffer.push(`const ${name}Map = Object.freeze({\n`)
  values.forEach((it) => {
    buffer.push(`  ${it.name}: ${it.value},\n`)
    if (node.aliases && it.name !== it.glName && it.glName != null) {
      buffer.push(`  ${it.glName}: ${it.value},\n`)
    }
    if (it.glName != null) {
      buffer.push(`  [gl.${it.glName}]: ${it.value},\n`)
    }
  })
  buffer.push(`})\n`)

  buffer.push(`/**\n`)
  buffer.push(` * @public\n`)
  buffer.push(` */\n`)
  buffer.push(`export function ${name}(value: ${node.ref}) {\n`)
  buffer.push(`  return ${name}Map[value]\n`)
  buffer.push(`}\n`)
  return buffer.join('')
}

function processEnum(name: string, data) {
  const node = data[name]
  const values = dereference(node, data)

  const buffer = []

  buffer.push(`/**\n`)
  buffer.push(` * @public\n`)
  buffer.push(` */\n`)
  buffer.push(`export enum ${name} {\n`)
  values.forEach((it) => buffer.push(`  ${it.name} = ${it.value},\n`))
  buffer.push(`}\n`)
    buffer.push(`/**\n`)
    buffer.push(` * @public\n`)
    buffer.push(` */\n`)
  buffer.push(`export type ${name}Name = keyof typeof ${name}\n`)

  if (node.nameOf) {
    buffer.push(`const ${name}ValueMap = Object.freeze<any>({\n`)
    values.forEach((it) => {
      buffer.push(`  ${it.name}: ${it.value},\n`)
      if (node.aliases && it.name !== it.glName && it.glName != null) {
        buffer.push(`  ${it.glName}: ${it.value},\n`)
      }
      buffer.push(`  [${it.value}]: ${it.value},\n`)
    })
    buffer.push(`})\n`)

    buffer.push(`/**\n`)
    buffer.push(` * @public\n`)
    buffer.push(` */\n`)
    buffer.push(`export function valueOf${name}(keyOrValue: ${name} | ${name}Name): ${name} {\n`)
    buffer.push(`  return ${name}ValueMap[keyOrValue]\n`)
    buffer.push(`}\n`)

    buffer.push(`/**\n`)
    buffer.push(` * @public\n`)
    buffer.push(` */\n`)
    buffer.push(`export function nameOf${name}(keyOrValue: ${name} | ${name}Name): ${name}Name {\n`)
    buffer.push(`  return ${name}[valueOf${name}(keyOrValue)] as ${name}Name\n`)
    buffer.push(`}\n`)

    buffer.push(`/**\n`)
    buffer.push(` * @public\n`)
    buffer.push(` */\n`)
    buffer.push(`export type ${name}Option = ${name} | ${name}Name\n`)
  }

  return buffer.join('')
}

function process(data) {
  const buffer = []
  buffer.push(`import { GLConst as gl } from './GLConst'\n\n`)
  Object.keys(data).forEach((name) => {
    const node = data[name]
    if (node.kind === undefined) {
      // skip
    } else if (node.kind === 'enum') {
      buffer.push(processEnum(name, data))
    } else if (node.kind === 'typemap') {
      buffer.push(processTypemap(name, data))
    } else if (node.kind === 'size') {
      buffer.push(processSize(name, data))
    } else {
      console.log('unknown node', node.kind, name)
    }
  })
  return buffer.join('')
}

export default (options: { idl: string | string[]}) => {
  return through(function(this: Transform, file: File, enc: string, cb) {
    this.push(new File({
      base: file.base,
      cwd: file.cwd,
      stat: file.stat,
      path: path.join(path.dirname(file.path), 'GLConst.ts'),
      contents: Buffer.from(processConstants(parseConstants(options.idl)))
    }))
    this.push(new File({
      base: file.base,
      cwd: file.cwd,
      stat: file.stat,
      path: path.join(path.dirname(file.path), 'Enums.ts'),
      contents: Buffer.from(process(JSON.parse(file.contents.toString())))
    }))
    cb(null, null)
  })
}

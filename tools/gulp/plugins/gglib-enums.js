'use strict'

const fs = require('fs')
const path = require('path')
const globby = require('globby')
const through = require('through-gulp')

function loadConstants(glob) {
  const result = {}
  globby.sync(glob).forEach((path) => {
    fs
      .readFileSync(path, 'UTF-8')
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

function dereference(node, data, constants) {
  return Object.keys(node.values).map((key) => {
    let value = node.values[key]
    let glName = null
    if (typeof value === 'string' && value.indexOf('gl:') >= 0) {
      glName = value.split(':')[1] || data.aliases[key]
      value = constants[glName]
    }

    return {
      name: key,
      value: value,
      glName: glName || data.aliases[key]
    }
  })
}

function processTypemap(name, data, constants) {
  const node = data[name]
  const values = dereference(node, data, constants)

  const buffer = []

  buffer.push(`/**\n`)
  buffer.push(` * @public\n`)
  buffer.push(` */\n`)
  buffer.push(`export const ${name} = Object.freeze({\n`)
  values.forEach((it) => {
    buffer.push(`  ${it.name}: ${it.value},\n`)
    if (node.aliases && it.name !== it.glName) {
      buffer.push(`  ${it.glName}: ${it.value},\n`)
    }
    buffer.push(`  ${constants[it.glName]}: ${it.value},\n`)
  })
  buffer.push(`})\n`)

  return buffer.join('')
}

function processSize(name, data, constants) {
  const node = data[name]
  const values = dereference(node, data, constants)

  const buffer = []

  buffer.push(`const ${name}Map = Object.freeze({\n`)
  values.forEach((it) => {
    buffer.push(`  ${it.name}: ${it.value},\n`)
    if (node.aliases && it.name !== it.glName) {
      buffer.push(`  ${it.glName}: ${it.value},\n`)
    }
    buffer.push(`  ${constants[it.glName]}: ${it.value},\n`)
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

function processEnum(name, data, constants) {
  const node = data[name]
  const values = dereference(node, data, constants)

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
      if (node.aliases && it.name !== it.glName) {
        buffer.push(`  ${it.glName}: ${it.value},\n`)
      }
      buffer.push(`  ${it.value}: ${it.value},\n`)
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

function process(data, constants) {

  const buffer = []
  Object.keys(data).forEach((name) => {
    const node = data[name]
    if (node.kind === undefined) {
      // skip
    } else if (node.kind === 'enum') {
      buffer.push(processEnum(name, data, constants))
    } else if (node.kind === 'typemap') {
      buffer.push(processTypemap(name, data, constants))
    } else if (node.kind === 'size') {
      buffer.push(processSize(name, data, constants))
    } else {
      console.log('unknown node', node.kind, name)
    }
  })
  return Buffer.from(buffer.join(''))
}

module.exports = (options) => {
  return through(function(file, enc, cb) {
    const data = JSON.parse(file.contents.toString())
    const constants = loadConstants(options.idl)
    const contents = process(data, constants)
    console.log(contents.toString())
    file.contents = process(data, constants)
    file.path = path.join(path.dirname(file.path), path.basename(file.path, '.json') + '.ts')
    console.log(file.path)
    cb(null, file)
  })
}

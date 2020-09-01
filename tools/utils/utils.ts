import * as cp from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

import { promisify } from "util"

export function spawn(options: cp.SpawnOptions & { cmd: string, args?: any[] }) {
  const cmd = options.cmd
  const args = (options.args || []).filter((it) => it != null)
  return new Promise((resolve, reject) => {
    const c = cp.spawn(cmd, args, options)
    c.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Exit code ${code}`)))
  })
}

export function namedTask<T>(name: string, taskFn: T) {
  return Object.assign(taskFn, { displayName: name })
}

export const exec = promisify(cp.exec)
export const writeFile = promisify(fs.writeFile)
export const copyFile = promisify(fs.copyFile)
export const mkdir = promisify(fs.mkdir)
export const exists = promisify(fs.exists)
export async function copyFileWithCreateDir(src: string, dest: string) {
  const dir = path.dirname(dest)
  if (!await exists(dir)) {
    await mkdir(dir, { recursive: true } as any)
  }
  return copyFile(src, dest)
}

export function replaceExtName(filePath: string, extName: string) {
  return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath))) + extName
}

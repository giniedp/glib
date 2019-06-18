import * as cp from 'child_process'

export function spawn(options: cp.SpawnOptions & { cmd: string, args?: any[] }) {
  return new Promise((resolve, reject) => {
    const c = cp.spawn(options.cmd, options.args || [], options)
    c.on('exit', (code) => code === 0 ? resolve() : reject(code))
  })
}

export function namedTask(name: string, taskFn: () => any) {
  return Object.assign(taskFn, { displayName: name }) // tslint:disable-line
}

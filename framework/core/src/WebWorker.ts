// tslint:disable max-classes-per-file
import { Log } from '@glib/core'

export const isWeb = typeof window === 'object'
export const isWorker = typeof self['importScripts'] === 'function'
export const isSupported = typeof Worker !== 'undefined'

const workers: PromiseWorker[] = []
const methods: any = {}

function enable(script: string, count: number = 1): boolean {
  if (!isSupported || workers.length) {
    return false
  }
  for (let i = 0; i < count; i++) {
    workers[i] = new PromiseWorker(script)
  }
  workers.length = count
}

function disable() {
  workers.forEach((element) => element.worker.terminate())
  workers.length = 0
}

function register(method: string, func: (...args: any[]) => any, workerId: number = 0): (...args: any[]) => any {
  methods[method] = new Work(method, func, workerId)
  return (...params: any[]) => methods[method].run(params)
}

function execute(method: string, ...params: any[]) {
  return methods[method].run(params)
}

class Work {
  constructor(private method: string, private action: (...args: any[]) => any, private workerId: number) {

  }

  public run(params: any): Promise<any> {
    let worker = workers[this.workerId] || workers[0]
    if (!worker) {
      return this.perform(params)
    }
    return worker.postMessage({
      method: this.method,
      params: params,
    })
  }

  public perform(params: any): Promise<any> {
    return Promise.resolve(this.action.apply({}, params))
  }
}

class PromiseWorker {
  public worker: Worker
  public idCounter = 0
  public handlers: Array<(...args: any[]) => any> = []

  constructor(stringUrl: string) {
    this.worker = new Worker(stringUrl)
    this.worker.onmessage = (e) => this.onMessage(e)
    this.worker.onerror = (e) => Log.l(e)
  }

  public onMessage(e: any) {
    let data = e.data
    let pId = data.promiseId
    let handle = this.handlers[pId]
    if (!handle) {
      return
    }
    delete this.handlers[pId]
    handle(data)
  }

  public postMessage(message: any) {
    let pId = this.idCounter++
    return new Promise((resolve, reject) => {
      this.handlers[pId] = (e: any) => {
        if (e.error) {
          reject(e.error)
        } else {
          resolve(e.result)
        }
      }
      message.promiseId = pId
      this.worker.postMessage(message)
    })
  }
}

if (isWorker) {
  let worker: any = self
  worker.addEventListener('message', (e: any) => {
    let data = e.data
    let work = methods[data.workId]
    if (!work) {
      return // not for us
    }

    work.perform(data.params).then((res: any) => {
      data.success = true
      data.result = res
      worker.postMessage(data)
    }).catch((err: any) => {
      data.success = false
      data.error = err
      worker.postMessage(data)
    })
  })
}

export const WebWorker = {
  enable, disable, register, execute,
}

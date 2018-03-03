// tslint:disable max-classes-per-file
import { Log } from './Log'

export const isWorker = typeof self['importScripts'] === 'function'
export const isWindowContext = typeof self['importScripts'] !== 'function'
export const isSupported = typeof Worker !== 'undefined'

export interface WorkRequest {
  method: string
  params: any[]
  handleId?: number
}

export interface WorkResponse<T = any> extends WorkRequest {
  success: boolean
  error: Error
  result: T
}

export type TaskFunction<T> = (...args: any[]) => T|Promise<T>

export interface BackgroundTask {
  name: string
  action: (...args: any[]) => any
  workerId: number
}

const workers: PromiseWorker[] = []
const methods: { [key: string]: BackgroundTask } = {}

function enable(script: string, num: number = 1): boolean {
  if (!isSupported || isWorker) {
    return false
  }
  // add missing workers
  for (let i = workers.length; i < num; i++) {
    workers[i] = new PromiseWorker(script)
  }
  // remove trailing workers
  for (let i = num; i < workers.length; i++) {
    if (workers[i]) {
      workers[i].terminate()
    }
  }
  workers.length = num
  return true
}

function count() {
  return workers.length
}

function disable() {
  workers.forEach((element) => element.terminate())
  workers.length = 0
}

function register<T>(method: string, func: TaskFunction<T>, workerId: number = 0): (...args: any[]) => Promise<T> {
  methods[method] = {
    name: method,
    action: func,
    workerId: workerId,
  }
  return (...params: any[]) => execute(method, ...params)
}

function unregister(method: string) {
  delete methods[method]
}

function execute<T>(method: string, ...params: any[]): Promise<T> {
  const task = methods[method]
  if (!task) {
    return Promise.reject(new Error(`Task '${method}' could not be found`))
  }
  const worker = workers[task.workerId] || workers[0]
  if (!worker) {
    return Promise.resolve(task.action.call({}, ...params))
  }
  return worker.postMessage<T>({
    method: task.name,
    params: params,
  })
}

export class PromiseWorker {
  public worker: Worker
  public idCounter = 0
  public handlers: Array<(...args: any[]) => any> = []

  constructor(workerOrUrl: string|Worker) {
    this.worker = typeof workerOrUrl === 'string' ? new Worker(workerOrUrl) : workerOrUrl
    this.worker.onmessage = this.handleMessage.bind(this)
    this.worker.onerror = (e) => Log.l(e)
  }

  public handleMessage(message: { data: WorkRequest }) {
    const data = message.data
    const handleId = data.handleId
    const handle = this.handlers[handleId]
    if (!handle) {
      return
    }
    delete this.handlers[handleId]
    handle(data)
  }

  public postMessage<T>(message: WorkRequest): Promise<T> {
    const handleId = this.idCounter++
    return new Promise((resolve, reject) => {
      this.handlers[handleId] = (e: WorkResponse) => {
        if (e.success) {
          resolve(e.result)
        } else {
          reject(e.error || new Error('work failed with no reason'))
        }
      }
      message.handleId = handleId
      this.worker.postMessage(message)
    })
  }

  public terminate() {
    this.worker.terminate()
  }
}

export function workRequestListener(channel: { postMessage: (message: WorkResponse) => void }) {
  return (e: { data: WorkRequest }) => {
    const data = e.data
    const task = methods[data.method]
    if (!task) {
      return // not for us
    }
    Promise.resolve(task.action.apply({}, data.params)).then((res: any) => {
      channel.postMessage({...data, success: true, result: res, error: null })
    }).catch((error: any) => {
      channel.postMessage({...data, success: false, result: null, error: error })
    })
  }
}

export const WebWorker = {
  count, enable, disable, register, unregister, execute,
}

if (isWorker) {
  addEventListener('message', workRequestListener(self as any))
}

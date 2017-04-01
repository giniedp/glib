module Glib.WebWorker {
  export const supported = typeof Worker !== 'undefined'
  export const isWeb = typeof window === 'object'
  export const isWorker = typeof importScripts === 'function'

  let workers: PromiseWorker[] = [];
  let active = false

  export function activate(script: string, count: number = 1): boolean {
    if (!supported || active) return false
    for (let i = 0; i < count; i++) {
      workers[i] = new PromiseWorker(script)
      workers.length = i + 1 
    }
    active = workers.length > 0
  }

  export function deactivate() {
    active = false
    workers.forEach(element => { element["terminate"]() });
    workers.length = 0
  }

  const registry: any = {}
  export function register(id: string, func: Function, thread: number = 0): any {
    registry[id] = new Work(id, thread, func); 
    return function() {
      return registry[id].run(arguments)
    }
  }

  export function execute(id: string, ...params) {
    return registry[id].run(params)
  }

  class Work {
    constructor(private workId: string, private thread: number, private action: Function) {

    }
    run(params): Glib.IPromise {
      let worker = workers[this.thread] || workers[0]
      if (!active || !worker) {
        return this.perform(params)
      }
      return worker.postMessage({
        workId: this.workId,
        params: params
      })
    }
    perform(params): Glib.IPromise {
      return Glib.Promise.resolve(this.action.apply({}, params))
    }
  }

  export class PromiseWorker {
    private worker: Worker
    private idCounter = 0
    private handlers: Function[] = []

    constructor(stringUrl: string) {
      this.worker = new Worker(stringUrl)
      this.worker.onmessage = (e) => this.onMessage(e)
      this.worker.onerror = (e) => Glib.utils.log(e)
    }

    onMessage(e: any) {
      let data = e.data
      let pId = data.promiseId
      let handle = this.handlers[pId]
      if (!handle) return
      delete this.handlers[pId]
      handle(data)
    }

    postMessage(message: any) {
      let pId = this.idCounter++
      let deferred = Glib.Promise.defer()
      this.handlers[pId] = function(e: any) {
        if (e.error) {
          deferred.reject(e.error)
        } else {
          deferred.resolve(e.result)
        }
      }
      message.promiseId = pId
      this.worker.postMessage(message)
      return deferred.promise
    }
  }
 
  if (isWorker) {
    let worker: any = self
    worker.addEventListener("message", function(e) {
      let data = e.data
      let work = registry[data.workId]
      if (!work) return // not for us
      
      work.perform(data.params).then(function(res) {
        data.success = true
        data.result = res
        worker.postMessage(data)
      }).catch(function(err) {
        data.success = false
        data.error = err
        worker.postMessage(data)
      })
    })
  }
}

export type RpcMethod<T = unknown> = (...args: any[]) => T | Promise<T>

export class RpcMethodRegistry {
  private methods = new Map<string, RpcMethod<unknown>>()

  public register<T>(name: string, handler: RpcMethod<T>) {
    if (this.methods.has(name)) {
      throw new Error(`Method '${name}' already registered`)
    }
    this.methods.set(name, handler)
  }

  public get<T>(name: string): RpcMethod<T> | undefined {
    return this.methods.get(name) as any
  }

  public has(name: string): boolean {
    return this.methods.has(name)
  }
}

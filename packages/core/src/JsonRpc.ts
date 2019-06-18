/**
 * @public
 */
export interface JsonRPCRequest {
  /**
   * The method name to call
   */
  method: string
  /**
   * The parameter to be used for the method call
   */
  params: any[]
  /**
   * A request id
   */
  id?: any
}

/**
 * @public
 */
export interface JsonRPCResponse<T = any> {
  /**
   * The result
   */
  result: T
  /**
   * The error
   */
  error: Error
  /**
   * A request id
   */
  id?: any
}

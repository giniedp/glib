/**
 * Generates a random uuid string
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16|0 // tslint:disable-line
    let v = c == 'x' ? r : (r&0x3|0x8) // tslint:disable-line
    return v.toString(16)
  })
}

export function errorOnMissingService(key: any) {
  throw new Error(`Service '${key}' is missing`)
}

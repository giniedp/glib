export function errorOnMissingService(key: any) {
  throw new Error(`Service '${key}' is missing`)
}

export function errorOnInjectUndefinedType(target: object, propertyKey?: string|symbol) {
  throw new Error(
    `undefined type detected evaluating @Inject(...) ${propertyKey.toString()} in class ${target}. Consider using forwardRef()`,
  )
}

export function errorOnServiceAsUndefinedType(target: object) {
  throw new Error(
    `undefined type detected evaluating @Service({ as: ... }) on class ${target}. Consider using forwardRef()`,
  )
}

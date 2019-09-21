function stringify(item: any) {
  if (!item) {
    return item
  }
  if ('name' in item) {
    return item.name
  }
  return item.toString()
}

export function errorOnMissingService(key: any, onEntity?: any, requiredBy?: any) {
  let msg = `Service '${stringify(key)}' is missing`
  if (onEntity) {
    msg += ` on entity ${stringify(onEntity)}`
  }
  if (requiredBy) {
    msg += ` required by ${stringify(requiredBy)}`
  }
  throw new Error(msg)
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

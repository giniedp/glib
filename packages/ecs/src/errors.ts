function stringify(item: any) {
  if (!item) {
    return '<unknown>'
  }
  if (typeof item === 'symbol') {
    return item.toString()
  }
  if (item.name) {
    return item.name
  }
  if (item.constructor && item.constructor.name) {
    return item.constructor.name
  }
  return item.toString()
}

export function errorOnMissingDependency(key: any, onEntity?: any, requiredBy?: any) {
  let msg = `Dependency '${stringify(key)}' is missing`
  if (onEntity) {
    msg += ` on entity '${stringify(onEntity)}'`
  }
  if (requiredBy) {
    msg += ` required by '${stringify(requiredBy)}'`
  }
  return new Error(msg)
}

export function errorOnInjectUndefinedType(target: object, propertyKey?: string|symbol) {
  return new Error(
    `undefined type detected evaluating @Inject(...) ${propertyKey.toString()} in class ${target}. Consider using forwardRef()`,
  )
}

export function errorOnComponentAsUndefinedType(target: object) {
  return new Error(
    `undefined type detected evaluating @Component({ as: ... }) on class ${target}. Consider using forwardRef()`,
  )
}

export function errorOnInstallNoMetadata(target: object) {
  return new Error(
    `no metadata found on '${stringify(target)}'. To add metadata decorate your components with the @Component(...) decorator`
  )
}

export function errorOnMultipleInstancesOfSingletonComponent(target: object) {
  return new Error(`Multiple instances of a singleton component detected: '${stringify(target)}'`)
}

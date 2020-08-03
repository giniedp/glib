/**
 * Application-specific data.
 */
export type Extras = any

/**
 * Dictionary object with extension-specific objects.
 */
export interface Extension {
  [key: string]: any
}

export interface Property {
  /**
   * Dictionary object with extension-specific objects.
   */
  extensions?: Extension

  /**
   * Application-specific data.
   */
  extras?: Extras
}

export interface RootProperty extends Property {
  /**
   * The user-defined name of this object.
   *
   * @remarks
   * The user-defined name of this object.  This is not necessarily unique, e.g., an accessor
   * and a buffer could have the same name, or two accessors could even have the same name.
   */
  name?: string
}

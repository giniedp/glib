/**
 * Application-specific data.
 *
 * @remarks
 * Although extras MAY have any type, it is common for applications to store and access custom data as key/value pairs.
 * Therefore, extras SHOULD be a JSON object rather than a primitive value for best portability.
 */
export type Extras = any

/**
 * Dictionary object with extension-specific objects.
 */
export type Extension = Record<string, any>

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

export interface NamedProperty extends Property {
  /**
   * The user-defined name of this object.
   *
   * @remarks
   * The user-defined name of this object.  This is not necessarily unique, e.g., an accessor
   * and a buffer could have the same name, or two accessors could even have the same name.
   */
  name?: string
}

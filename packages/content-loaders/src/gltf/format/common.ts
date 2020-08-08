/**
 * Application-specific data.
 */
export type GLTFExtras = any

/**
 * Dictionary object with extension-specific objects.
 */
export interface GLTFExtension {
  [key: string]: any
}

export interface GLTFProperty {
  /**
   * Dictionary object with extension-specific objects.
   */
  extensions?: GLTFExtension

  /**
   * Application-specific data.
   */
  extras?: GLTFExtras
}

export interface GLTFRootProperty extends GLTFProperty {
  /**
   * The user-defined name of this object.
   *
   * @remarks
   * The user-defined name of this object.  This is not necessarily unique, e.g., an accessor
   * and a buffer could have the same name, or two accessors could even have the same name.
   */
  name?: string
}

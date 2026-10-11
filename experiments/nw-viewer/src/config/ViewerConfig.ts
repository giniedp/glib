import { Config } from './Config'
import type { ConfigValues } from './properties'
import { viewerConfigSchema } from './schema'

/**
 * The runtime settings of the viewer, provided as a system: `entity.service(ViewerConfig)`
 */
export class ViewerConfig extends Config<typeof viewerConfigSchema> {
  public constructor() {
    super(viewerConfigSchema, { storageKey: 'nw-viewer.config' })
  }
}

/**
 * The current values of {@link ViewerConfig}
 */
export type ViewerConfigValues = Readonly<ConfigValues<typeof viewerConfigSchema>>

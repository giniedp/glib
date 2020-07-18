import { DataUri, Uri } from '@gglib/utils'
import { LoaderSpec, LoaderInputs, LoaderOutput } from './Loader'
import { Pipeline } from './Pipeline'
import { PipelineContext } from './PipelineContext'

/**
 * Registeres a loader specification at the default pipeline (`Pipeline.default`) and returns
 * without any modification
 *
 * @public
 * @param spec - The loader specification to register
 */
export function loader<T extends LoaderSpec>(spec: T): T {
  Pipeline.default.register(spec)
  return spec
}

/**
 * Resolves a uri reference relative to the source of given context.
 *
 * @public
 * @remarks
 * If `refUri` is absolute or is in data uri format then it is returned as is. Otherwise
 * it is merged with `context.source`
 *
 * @param refUri - The uri
 * @param context - The context
 */
export function resolveUri(refUri: string, context: PipelineContext): string {
  return DataUri.isDataUri(refUri) ? refUri : Uri.merge(context.source, refUri)
}

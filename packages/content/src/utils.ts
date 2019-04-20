import { DataUri, Uri } from '@gglib/core'
import { LoaderSpec } from './Loader'
import { Pipeline } from './Pipeline'
import { PipelineContext } from './PipelineContext'

/**
 * Registeres a loader specification at the default pipeline (`Pipeline.default`) and returns
 * without any modification
 *
 * @param spec The loader specification to register
 */
export function loader<I = any, O = any, D = any>(spec: LoaderSpec<I, O, D>): LoaderSpec<I, O, D> {
  Pipeline.default.register(spec)
  return spec
}

/**
 * Resolves a uri reference relative to the source of given context.
 *
 * @remarks
 * If `refUri` is absolute or is in data uri format then it is returned as is. Otherwise
 * it is merged with `context.source`
 *
 * @param refUri The uri
 * @param context The context
 */
export function resolveUri(refUri: string, context: PipelineContext): string {
  return DataUri.isDataUri(refUri) ? refUri : Uri.merge(context.source, refUri)
}

import { GetComponent, type GameEntity } from '@gglib/ecs'
import { Show } from 'solid-js'
import { Button, Group, Icon, TextWidget } from 'tweak-ui'
import { materialAssetPath, normalizeAssetPath } from '../../../content/assetIds'
import { MeshLoaderComponent } from '../../../game/slice/MeshLoaderComponent'
import { useTools } from '../../app/tools'
import svgFolderTree from '../../icons/folder-tree.svg?raw'

/**
 * The game files of an entity's model: the mesh and the material of its {@link MeshLoaderComponent}, each with
 * "Reveal in browser", which opens the file as a tab of the browser tool.
 *
 * @remarks
 * The loader is on the entity, or on its parent: the model entities are children of the loader's entity.
 */
export function SourceFilesProps(props: { data: GameEntity }) {
  const tools = useTools()
  const loader = () => meshLoaderOf(props.data)
  const reveal = (path: string) => tools.open('browser', `?file=${encodeURIComponent(path)}`)

  return (
    <Show when={loader()}>
      {(it) => (
        <Group title="Files">
          <FileRow label="Model" path={normalizeAssetPath(it().data.mesh)} onReveal={reveal} />
          <Show when={it().data.material}>
            {(material) => <FileRow label="Material" path={materialAssetPath(material())} onReveal={reveal} />}
          </Show>
        </Group>
      )}
    </Show>
  )
}

function FileRow(props: { label: string; path: string; onReveal: (path: string) => void }) {
  return (
    <TextWidget
      label={props.label}
      value={props.path}
      readonly
      slotAfter={
        <Button
          ghost
          title="Reveal in browser: open the file as a tab of the browser tool"
          icon={<Icon svg={svgFolderTree} />}
          onClick={() => props.onReveal(props.path)}
        />
      }
    />
  )
}

function meshLoaderOf(entity: GameEntity | null | undefined): MeshLoaderComponent | null {
  if (!entity) {
    return null
  }
  return (
    entity.component(MeshLoaderComponent, GetComponent.Optional) ??
    entity.getTransform()?.parent?.entity?.component(MeshLoaderComponent, GetComponent.Optional) ??
    null
  )
}

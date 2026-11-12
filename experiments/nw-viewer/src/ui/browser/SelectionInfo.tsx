import { PollWidget } from 'tweak-ui'
import type { ListFile } from '../../api/browse'
import { formatBytes } from '../common/format'
import { assetTypes } from './assetTypes'
import { OpenInViewer } from './OpenInViewer'

/**
 * What the sidebar shows about the selected file: path, type and size. Everything else is in the
 * details of an opened file.
 */
export function SelectionInfo(props: { file: ListFile }) {
  const types = assetTypes()
  return (
    <div class="nw-selection">
      <PollWidget label="Path" value={props.file.path} />
      <PollWidget label="Type" value={types()[props.file.type]?.label ?? ''} />
      <PollWidget label="Size" value={formatBytes(props.file.size)} />
      <div class="nw-selection-actions">
        <OpenInViewer path={props.file.path} />
      </div>
    </div>
  )
}

/**
 * What the sidebar shows about the selected folder: its path, and a level folder opens in the viewer
 */
export function FolderInfo(props: { path: string }) {
  return (
    <div class="nw-selection">
      <PollWidget label="Path" value={props.path} />
      <div class="nw-selection-actions">
        <OpenInViewer path={props.path} folder />
      </div>
    </div>
  )
}

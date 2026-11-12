import { createSignal } from 'solid-js'
import { Button, Icon } from 'tweak-ui'
import type { NwViewer } from '../../../viewer'
import svgGear from '../../icons/gear.svg?raw'
import { ConfigActions, ConfigProps } from '../registry/uiConfig'
import { ModalDialog } from './modalDialog'

/**
 * Opens the settings ({@link ViewerConfig}) in a dialog
 */
export function SettingsButton(props: { viewer: NwViewer }) {
  const [open, setOpen] = createSignal(false)
  return (
    <>
      <Button square title="Settings" icon={<Icon svg={svgGear} />} onClick={() => setOpen(true)} />
      <ModalDialog
        title="Settings"
        open={open()}
        onClose={() => setOpen(false)}
        actions={<ConfigActions config={props.viewer.config} large />}
      >
        <div class="nw-dialog-content nw-dialog-content-wide">
          <ConfigProps data={props.viewer.config} />
        </div>
      </ModalDialog>
    </>
  )
}

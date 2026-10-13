import type { JSX } from 'solid-js'
import { Bar, Button, Dialog, Icon, Section } from 'tweak-ui'
import svgClose from '../icons/xmark.svg?raw'
export interface ModalDialogProps {
  title: string
  open: boolean
  onClose: () => void
  /**
   * Buttons in the footer, before the close button
   */
  actions?: JSX.Element
  children: JSX.Element
}

/**
 * A dialog with a title bar and a footer bar. The close buttons call `onClose`.
 */
export function ModalDialog(props: ModalDialogProps) {
  return (
    <Dialog open={props.open} onToggle={(open) => !open && props.onClose()} class="nw-dialog">
      <Section
        class="twk:gap-0"
        header={
          <Bar
            class="twk-bar-lg twk:bg-neutral twk:p-sm"
            end={
              <Button class="twk-btn-xl" ghost square onClick={props.onClose}>
                <Icon svg={svgClose} />
              </Button>
            }
          >
            <span class="twk:pl-lg">{props.title}</span>
          </Bar>
        }
        footer={
          <Bar
            class="twk:bg-base-100"
            end={
              <>
                {props.actions}
                <Button large onClick={props.onClose}>
                  Close
                </Button>
              </>
            }
          />
        }
      >
        {props.children}
      </Section>
    </Dialog>
  )
}

import { For, type JSX } from 'solid-js'
import { Button, ButtonGroup, Icon, Toolbar } from 'tweak-ui'
import svgFolderTree from '../icons/folder-tree.svg?raw'
import svgMountainSun from '../icons/mountain-sun.svg?raw'
import { useTools, type ToolId } from './tools'

/**
 * The bar at the top of every tool: the tool switch first, then the items of the tool.
 */
export function AppBar(props: {
  /**
   * Translucent, above the engine canvas (the viewer). Otherwise an opaque bar of the page.
   */
  overlay?: boolean
  start?: JSX.Element
  end?: JSX.Element
}) {
  return (
    <Toolbar
      class={props.overlay ? 'nw-app-bar nw-app-bar-overlay' : 'nw-app-bar'}
      start={
        <>
          <ToolSwitch />
          {props.start}
        </>
      }
      end={props.end}
    />
  )
}

const TOOLS: Array<{ id: ToolId; label: string; icon: string; title: string }> = [
  { id: 'viewer', label: 'Viewer', icon: svgMountainSun, title: 'Levels and models in 3D' },
  { id: 'browser', label: 'Browser', icon: svgFolderTree, title: 'Browse the game files' },
]

/**
 * Switches between the tools, a segmented control
 */
function ToolSwitch() {
  const { current, open } = useTools()

  return (
    <ButtonGroup class="nw-tool-switch">
      <For each={TOOLS}>
        {(tool) => (
          <Button
            active={current() === tool.id}
            title={tool.title}
            icon={<Icon svg={tool.icon} />}
            onClick={() => open(tool.id)}
          >
            {tool.label}
          </Button>
        )}
      </For>
    </ButtonGroup>
  )
}

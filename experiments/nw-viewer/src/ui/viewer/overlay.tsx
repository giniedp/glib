import { createSignal, Show } from 'solid-js'
import { Button, Icon, track } from 'tweak-ui'
import type { NwViewer } from '../../viewer'
import { AppBar } from '../app/AppBar'
import svgCamera from '../icons/camera-viewfinder.svg?raw'
import svgSidebarR from '../icons/sidebar-right.svg?raw'
import svgSidebar from '../icons/sidebar.svg?raw'
import svgPause from '../icons/pause.svg?raw'
import svgPlay from '../icons/play.svg?raw'
import svgVolume from '../icons/volume-high.svg?raw'
import svgVolumeOff from '../icons/volume-xmark.svg?raw'
import { PanelScope } from './panel'
import { NwSceneBrowser, ScenesButton, SettingsButton, StatsBar, StatsPanel } from './panels'
import { configValue } from './reactive'
import { uiRegistry } from './registry'

/**
 * The ui of the viewer tool above the canvas
 */
export function ViewerOverlay(props: { viewer: NwViewer }) {
  return (
    <div class="tweak-ui nw-overlay">
      <Overlay viewer={props.viewer} />
    </div>
  )
}

/**
 * Pauses the game clock at its current time, or lets a paused or fixed clock run again
 */
function toggleClock(viewer: NwViewer) {
  const clock = viewer.clock
  if (clock.game.paused || clock.game.fixed != null) {
    clock.setFixed(null)
    clock.resume()
  } else {
    clock.pause()
  }
}

/**
 * The toolbar above the canvas and the sidebars: the scene browser on the left, stats and settings on the right
 */
function Overlay(props: { viewer: NwViewer }) {
  const viewer = props.viewer
  const [left, setLeft] = createSignal(false)
  const [right, setRight] = createSignal(false)
  const audioEnabled = configValue(viewer.config, 'audioEnabled')
  // scripts and ?clock= change the clock as well, so it is polled
  const clockFrozen = track(() => viewer.clock.game.paused || viewer.clock.game.fixed != null, { interval: 500 })
  const registry = uiRegistry()

  return (
    <div class="nw-overlay-layout">
      <AppBar
        overlay
        end={
          <>
            <StatsBar viewer={viewer} />
            <ScenesButton viewer={viewer} />
            <SettingsButton viewer={viewer} />
            <Button
              square
              accent={audioEnabled()}
              title={audioEnabled() ? 'Audio is on, click to mute' : 'Audio is off, click to play it'}
              icon={<Icon svg={audioEnabled() ? svgVolume : svgVolumeOff} />}
              // runs in the click, so the audio context can start (autoplay policy)
              onClick={() => viewer.config.set('audioEnabled', !audioEnabled())}
            />
            <Button
              square
              accent={clockFrozen()}
              title={
                clockFrozen()
                  ? `Time is paused at ${viewer.clock.game.total.toFixed(2)} s, click to play`
                  : 'Pause the time (shaders, particles, fog volumes), for comparable shots'
              }
              icon={<Icon svg={clockFrozen() ? svgPlay : svgPause} />}
              onClick={() => toggleClock(viewer)}
            />
            <Button
              square
              title="Download a screenshot (canvas resolution)"
              icon={<Icon svg={svgCamera} />}
              onClick={() => viewer.downloadScreenshot()}
            />
            {/* the two sidebar toggles side by side, in the order of the sidebars */}
            <Button
              square
              title={left() ? 'Hide the scene tree' : 'Show the scene tree (left sidebar)'}
              icon={<Icon svg={svgSidebar} />}
              active={left()}
              onClick={() => setLeft(!left())}
            />
            <Button
              square
              title={right() ? 'Hide the stats' : 'Show the stats (right sidebar)'}
              icon={<Icon svg={svgSidebarR} />}
              active={right()}
              onClick={() => setRight(!right())}
            />
          </>
        }
      />
      <div class="nw-overlay-panes">
        <Show when={left()}>
          <aside class="nw-overlay-sidebar">
            <PanelScope>
              <NwSceneBrowser viewer={viewer} registry={registry} />
            </PanelScope>
          </aside>
        </Show>
        <div class="nw-overlay-fluid" />
        <Show when={right()}>
          <aside class="nw-overlay-sidebar">
            <PanelScope>
              <StatsPanel viewer={viewer} />
            </PanelScope>
          </aside>
        </Show>
      </div>
    </div>
  )
}

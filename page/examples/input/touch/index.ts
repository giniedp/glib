import { TouchPane } from '@gglib/input'

// Create an instance of the `TouchPane` class.
// The `eventTarget` option tells that the `TouchPane`
// should use the given element to listen to browser events.
// The default is `document`
const touchPane = new TouchPane({
  eventTarget: document.querySelector('.capture-pane'),
})

// The `changed` event will be fired when a state change has been detected.
touchPane.on('changed', (pane: TouchPane, e: TouchEvent) => {
  const code = document.querySelector('code') as HTMLElement
  code.textContent = Array.from(pane.touches.keys()).map((id) => {
    return JSON.stringify({
      id: pane.touches.get(id).identifier,
      x: TouchPane.getX(pane.touches.get(id)),
      y: TouchPane.getY(pane.touches.get(id)),
    }, null, 2)
  }).join('\n')
})

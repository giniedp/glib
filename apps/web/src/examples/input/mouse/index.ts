import { Mouse } from '@gglib/input'

// Create an instance of the `Mouse` class.
// The `eventTarget` option tells that the `Mouse`
// should use the given element to listen to browser events.
// The default is `document`
// If we want to be able to lock the mouse we have to specify
// a custom element as we do here
const mouse = new Mouse({
  eventTarget: document.documentElement,
  captureTarget: document.querySelector('.capture-pane'),
})

// The `changed` event will be fired when the mouse has moved or a button
// has been pressed or released.
mouse.on('changed', (m: Mouse, e) => {
  const cursor = document.querySelector('.cursor') as HTMLElement
  const code = document.querySelector('code') as HTMLElement

  code.textContent = JSON.stringify(m.state, null, 2)

  cursor.style.left = (m.state.clientX - cursor.getBoundingClientRect().width / 2) + 'px'
  cursor.style.top = (m.state.clientY - cursor.getBoundingClientRect().height / 2) + 'px'
})

// Here we simply use `dbclick` event on which
// we lock and unlock the mouse.
mouse.on('dblclick', (m: Mouse, e) => {
  if (m.isLocked) {
    m.unlock()
  } else {
    m.lock()
  }
})

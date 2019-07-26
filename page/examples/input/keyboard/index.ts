import { Keyboard, KeyboardKey } from '@gglib/input'

// Create an instance of the `Keyboard` class.
// The `eventTarget` option tells that the `Keyboard`
// should use the given element to listen to browser events.
// The default is `document`
const keyboard = new Keyboard({
  eventTarget: document,
})

// The `changed` event will be fired when new pressed or
// released keys are detected.
keyboard.on('changed', (k: Keyboard, e) => {
  const container = document.querySelector('.key-container')
  container.innerHTML = ''
  k.keys.forEach((code) => {
    const el = document.createElement('span')
    el.classList.add('key')
    el.innerHTML = `<span class="key">
      <label>${KeyboardKey[code]}</label>
      <value>${code}</value>
    </span>`
    container.appendChild(el)
  })
})

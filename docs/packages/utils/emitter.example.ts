import { brand, EventEmitter, EventType } from '@gglib/utils'

// typed event channels
// events only have one argument
const onEvent1 = brand<EventType<string>>(Symbol('Event Type 1'))
const onEvent2 = brand<EventType<number>>(Symbol('Event Type 2'))
const onEvent3 = brand<EventType<boolean>>(Symbol('Event Type 3'))

// create an emitter instance
const emitter = new EventEmitter()

// add event listener, that should only be called once
emitter.once(onEvent1, onEvent1Callback)
emitter.emit(onEvent1, 'argument for event 1')

// add a permanent event listener
emitter.on(onEvent2, onEvent2Callback)
emitter.emit(onEvent2, 10)
emitter.off(onEvent2, onEvent2Callback)

// add a permanent event listener and hold on to an
// unsubscribe function
const unsubscribe = emitter.on(onEvent3, onEvent3Callback)
emitter.emit(onEvent3, true)
unsubscribe()

function onEvent1Callback(arg: string) {
  console.log('event 1 callback', arg)
}

function onEvent2Callback(arg: number) {
  console.log('event 2 callback', arg)
}

function onEvent3Callback(arg: boolean) {
  console.log('event 3 callback', arg)
}

// the channels of the emitter are RxJS subscribable
// which is the bridge into rxjs world if needed.
emitter.channel(onEvent1).subscribe({
  next: console.log,
})

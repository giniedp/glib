---
title: Audio Source
aside: false
---

# Audio Source

The `AudioSystem` plays sounds with the Web Audio API. It is not part of the `EcsGame` defaults, add it in `onCreate`:

```ts
protected override onCreate() {
  this.world.addSystem(new AudioSystem())
}
```

Audio files are loaded like any other asset, `content.load(AudioAssetType, '/audio/impact.ogg')` resolves to an
`AudioBuffer`, decoded with the audio context of the system. Create the system before loading audio.

- An `AudioSourceComponent` plays its `clip` at the position of its entity. `play()` and `stop()` are requests that the
  system applies in its next render step. Changes to `volume`, `playbackRate`, `loop` and the distance settings apply
  to a playing sound.
- A `spatial` source is attenuated and panned relative to the listener. `refDistance`, `rolloffFactor`,
  `maxDistance` and `distanceModel` control how the volume drops with distance. Turn `spatial` off for music or UI
  sounds.
- `autoplay` starts the sound when the entity is activated. Deactivating the entity stops it.
- The `AudioListenerComponent` marks the entity that hears, usually the camera. There is one listener per audio
  context, the system uses the first active one. In the example the listener is the blue square in the center,
  facing into the screen, so the orange emitter pans from ear to ear as it orbits.

Browsers keep audio suspended until the user interacts with the page. The system resumes it on the first click or key
press, so click into the example to hear it.

Sounds that don't need an entity, like UI clicks or impacts, can be played with
`world.getSystem(AudioSystem).audio.playOneShot(buffer)`. The `AudioDevice` behind it doesn't depend on the ECS and can
be used by plain games as well, see the breakout example.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

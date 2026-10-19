---
title: Tween System
aside: false
---

# Tween System

The `TweenSystem` interpolates values over time. A `Tween` holds up to four values in `x`, `y`, `z` and `w`,
so it works for scalars (`value`) and vectors alike. Since a tween is an `IVec4`, it can be passed directly to
vector functions, e.g. `transform.setPositionV(tween)`. Rotations are not slerped, tween an angle instead.

- `tweens.play(options)` creates and starts a tween, `tweens.create(options)` creates an idle one.
- Options are `from`, `to`, `duration` and `delay` (in seconds), `ease`, `repeat` (`Infinity` loops forever), `yoyo` (each cycle runs to `to` and back),
  `onUpdate`, `onComplete` and an optional `clock` of the `TimeSystem`. All of them are plain fields on the tween.
- `play()` restarts, `pause()`, `resume()`, `stop()` halts without `onComplete`, `finish()` jumps to the end.
- Tweens are reusable. Keep a tween and call `setFrom`, `setTo` and `play()` again, no garbage is created per frame or per replay.
- A tween can be driven without a system by calling `tween.advance(dt)`.

The system is added by `EcsGame` by default.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

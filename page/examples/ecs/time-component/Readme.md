# TimeComponent

In this example we show two spinning cubes each using a different time clock than the other

The `TimeComponent` is where the game time is tracked and where the elapsed frame time can be infered from.
Updatable components will usually have a reference to the `TimeComponent` if they need to be updated
based on elapsed time.

Further the `TimeComponent` can hold any number of distinct time clocks each with a different speed multiplier.
This can be used for various mechanics where different time speeds are needed. For example a game could have
one clock for its game logic which may be paused, but another clock for its menu logic or debug camera etc.

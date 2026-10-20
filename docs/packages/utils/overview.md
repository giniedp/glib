---
order: 0
---

# Overview

`@gglib/utils` is a collection of small shared utilities used across all gglib packages.
It has no dependencies and no graphics specific code.

## Types

Brand types add a nominal tag to primitive values, for example to tell an entity id from a component id although both are numbers.
gglib uses brands with plain constant objects instead of TypeScript enums.

## Events

- `eventSource` and `valueSource` are typed single event channels. They are compatible with RxJS observables.
- `EventEmitter` dispatches multiple event types from one object.
- `EventBus` collects events from many emitters in one place.

## Collections

Allocation friendly helpers for hot code paths, such as `PooledList`, `PriorityQueue`, `idMap`, `idSet` and in place array helpers.

## Readers

- `BinaryReader` reads typed values from binary data, for example when parsing file formats.
- `TextReader` reads text character by character and helps to write simple parsers.

## URIs

Helpers to parse and merge URIs and to extract path parts like directory, file name and extension.

## Misc

- `loop` runs a callback on `requestAnimationFrame`.
- `MetricSampler` collects timing samples for performance statistics.
- JSON RPC helpers send requests to workers and receive the responses.
- Small DOM helpers wrap the visibility and pointer lock APIs.
- `uuid` creates random identifiers.

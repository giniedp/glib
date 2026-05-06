# Render Graph / Frame Graph Design Summary

## Core Architecture

### Concepts
- **RenderTask / RenderPass**: Defines setup, render, cleanup
- **FrameBuilder**: Builds graph per frame
- **FrameNode**: Represents a pass execution
- **FrameResource**: Logical resource with versioning
- **ResourceManager**: Owns physical textures and pooling

---

## Channels

Channels are **semantic identities**, not physical resources.

- Must remain descriptor-consistent across frame
- Define meaning (Color, Depth, etc.)
- Descriptor resolved via registry

---

## Resource Versioning

Each write creates a new version unless:
- write-after-write (no readers) → reuse version
- modifyInPlace → same version

---

## Resource Types

### Transient
- Created and destroyed within graph
- Scheduled via firstUse / lastUse

### Imported
- External resource
- No acquire/release in graph

### Exported
- Produced in graph
- Lifetime extends beyond graph
- Released externally

---

## FrameResource

```ts
interface FrameResource {
  texture?: Texture

  channel: RenderChannel
  version: number

  producer: FrameNode | null
  desc?: FrameResourceDesc

  firstUse: number
  lastUse: number

  imported?: boolean
  exported?: boolean

  resolvedWidth?: number
  resolvedHeight?: number
  key?: string
}
```

---

## FrameNode

```ts
interface FrameNode {
  id: number
  pass: RenderPass

  reads: FrameResource[]
  writes: FrameResource[]
  dependencies: FrameNode[]

  acquire: FrameResource[]
  release: FrameResource[]

  culled: boolean
}
```

---

## Scheduling (Core)

```ts
for (let i = 0; i < this.resources.size; i++) {
  const res = this.resources.item(i)

  if (res.imported) continue
  if (res.firstUse === Infinity || res.lastUse === -Infinity) continue

  const first = res.firstUse
  const last = res.lastUse

  if (first < nodes.length) {
    nodes[first].acquire.push(res)
  }

  if (!res.exported && last < nodes.length) {
    nodes[last].release.push(res)
  }
}
```

---

## Culling

- Start from output channels
- Traverse producer dependencies
- Mark reachable nodes

---

## Lifetime Tracking

```ts
resource.firstUse = min index
resource.lastUse = max index
```

Computed over **culled nodes only**

---

## Resource Descriptor

Descriptors are:

- Optional in graph (validation only)
- Defined via registry per channel

```ts
interface FrameResourceDesc {
  format: SurfaceFormat
  sampleCount: number
  usage: RenderResourceUsage
  size: FrameSize
}
```

---

## FrameSize

```ts
type FrameSize =
  | { kind: 'absolute'; width: number; height: number }
  | { kind: 'relative'; scale: number }
```

Resolved at allocation time.

---

## Descriptor Resolution

```ts
resolveSize(size, view)
```

Done in ResourceManager.

---

## Descriptor Hashing

### Resolved Descriptor

```ts
interface ResolvedDesc {
  width: number
  height: number
  format: SurfaceFormat
  sampleCount: number
  usage: number
}
```

### Key

```ts
function makeKey(desc): string
```

Used for pooling.

---

## ResourceManager

### Pool

```ts
Map<string, Texture[]>
```

### Acquire

- resolve descriptor
- compute key
- reuse or create texture

### Release

- return to pool

---

## Eviction

- Track `lastUsedFrame`
- Remove after N frames unused

---

## Modify Semantics

### write(channel)
- overwrite
- new version

### modify(channel)
- read + write
- new version

### modifyInPlace(channel)
- read + write
- same version
- pass responsible for hazards

---

## Import

```ts
import(channel, texture, desc)
```

- external resource
- no lifetime management

---

## Export

```ts
export(channel)
```

- marks resource as externally used
- prevents release

---

## Key Design Decisions

- Channels define identity
- Descriptors resolved externally
- Graph handles lifetimes only
- Passes handle complex hazards if needed
- ResourceManager is graph-agnostic
- Lazy allocation on first use
- Per-frame graph rebuild

---

## Tradeoffs

### Simplicity vs Optimal Memory
- modifyInPlace → simpler, less optimal
- no global ping-pong optimization

### Centralized Descriptors
- consistent but less flexible

---

## Future Extensions

- Temporal resources
- Relaxed descriptor matching
- Subresource tracking
- Full frame graph across views
- Async compute scheduling

---

## Core Principle

**Graph defines WHEN resources are needed, not HOW they are implemented.**

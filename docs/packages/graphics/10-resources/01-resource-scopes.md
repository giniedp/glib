---
title: Resource Scopes
aside: false
order: 10
---

# Resource Scopes

A `ResourceScope` owns GPU resources and releases them all at once when it is disposed.
Use one scope per lifetime, e.g. a level, a region or a single object, instead of disposing resources one by one.

<Example  />

:::tabs variant:code
== example.ts
<ExampleCode />
:::

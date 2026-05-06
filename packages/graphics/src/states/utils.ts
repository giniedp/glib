export type StateNames<T, Instance> = Exclude<
  {
    [K in keyof T]: T[K] extends Instance ? K : never
  }[keyof T],
  'prototype'
>

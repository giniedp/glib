import { TextReader } from '@gglib/utils'

const reader = new TextReader('name: "Alice" age: 30 tags: [admin, active]')

const key1 = reader.readToken() // "name"
reader.skipWhitespaceAndSymbols()
const value1 = reader.readUntil(' ') // "\"Alice\""

const key2 = reader.readToken() // "age"
reader.skipWhitespaceAndSymbols()
const value2 = reader.readToken() // "30"

const key3 = reader.readToken() // "tags"
reader.skipWhitespaceAndSymbols()
const tags = reader.readBlock('[', ']') // "admin, active"

console.log(key1, value1, key2, value2, key3, tags)

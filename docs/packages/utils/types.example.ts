import { brand, Brand } from '@gglib/utils'

type Channel = Brand<string, 'Channel'>
const Channel = {
  Red: brand<Channel>('red'),
  Green: brand<Channel>('green'),
  Blue: brand<Channel>('blue'),
}

function typedFunction(channel: Channel) {
  console.log(channel)
}

typedFunction(Channel.Red)
typedFunction(Channel.Green)
typedFunction(Channel.Blue)

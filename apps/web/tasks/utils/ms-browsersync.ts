import bs from 'browser-sync'
import Metalsmith from 'metalsmith';

export default (options: { name: string, config: bs.Options }) =>{
  return (files: Metalsmith.Files, smith: Metalsmith, done: Function) => {
    done()
    if (process.env.METALSMITH_WATCH && !bs.has(options.name)) {
      start(options)
    }
  };
}

function start(options: { name: string, config: bs.Options }) {
  const instance = bs.create(options.name).init(options.config)
  process.on('SIGTERM', () => instance.cleanup())
  process.on('SIGINT', () => instance.cleanup())
}

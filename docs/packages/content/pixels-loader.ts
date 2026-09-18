import { AssetContainer, AssetLoader, LoadContext } from '@gglib/content'
import MARIO from './mario.pixels'
import MEGAMAN from './megaman.pixels'
import { PixelsContainer } from './pixels-container'
import SONIC from './sonic.pixels'

export class PixelsLoader implements AssetLoader {
  // the file extensions that this loader is able to handle
  public static extensions = ['.pixels']

  // optionally we could match against mime types
  public static mimeTypes = []

  // the loader factory that will be called once for every load request
  public static create = () => new PixelsLoader()

  public async load(url: string, context: LoadContext): Promise<AssetContainer> {
    // Usually we would fetch the file from the network like this:
    //
    //   const input = context.content.fetch(url, { responseType: 'text' }).then((response) => response.body)
    //
    // However, in this example we have hardcoded the pixel data
    const input = {
      '/mario.pixels': MARIO,
      '/megaman.pixels': MEGAMAN,
      '/sonic.pixels': SONIC,
    }[url]

    if (!input) {
      throw new Error(`PixelsLoader: No data found for URL: ${url}`)
    }

    // The loader is only responsible for fetching data and creating an asset container.
    // Here we just pass the loaded data to PixelsContainer for further processing
    return new PixelsContainer(input)
  }
}

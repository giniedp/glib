//! parseUri 3.0.2; Steven Levithan; MIT License
/* A mighty but tiny URI/URN/URL parser; splits any URI into its parts (all of which are optional).
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  href                                                    │
├────────────────────────────────────────────────────────────────┬─────────────────────────────────────────┤
│                             origin                             │                resource                 │
├──────────┬─┬───────────────────────────────────────────────────┼──────────────────────┬───────┬──────────┤
│ protocol │ │                     authority                     │       pathname       │ query │ fragment │
│          │ ├─────────────────────┬─────────────────────────────┼───────────┬──────────┤       │          │
│          │ │      userinfo       │            host             │ directory │ filename │       │          │
│          │ ├──────────┬──────────┼──────────────────────┬──────┤           ├─┬────────┤       │          │
│          │ │ username │ password │       hostname       │ port │           │ │ suffix │       │          │
│          │ │          │          ├───────────┬──────────┤      │           │ ├────────┤       │          │
│          │ │          │          │ subdomain │  domain  │      │           │ │        │       │          │
│          │ │          │          │           ├────┬─────┤      │           │ │        │       │          │
│          │ │          │          │           │    │ tld │      │           │ │        │       │          │
"  https   ://   user   :   pass   @ sub1.sub2 . dom.com  : 8080   /p/a/t/h/  a.html    ?  q=1  #   hash   "
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
Also supports IPv4/IPv6 addresses, URNs, and many edge cases not shown here. Supports providing a
list of second-level domains that should be treated as part of the top-level domain (ex: co.uk) */

export type ParseUriObject = {
  /**
   * The full URI that was parsed.
   */
  href: string
  /**
   * ```
   * uri   : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * origin: "https://user:pass@sub1.sub2.dom.com:8080"
   * ```
   */
  origin: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * protocol: "https"
   * ```
   */
  protocol: string
  /**
   * ```
   * uri      : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * authority:         "user:pass@sub1.sub2.dom.com:8080"
   * ```
   */
  authority: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * userinfo:         "user:pass"
   * ```
   */
  userinfo: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * username:         "user"
   * ```
   */
  username: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * password:              "pass"
   * ```
   */
  password: string
  /**
   * ```
   * uri : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * host:                   "sub1.sub2.dom.com:8080"
   * ```
   */
  host: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * hostname:                   "sub1.sub2.dom.com"
   * ```
   */
  hostname: string
  subdomain: string
  domain: string
  tld: string
  port: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * resource:                                         "/p/a/t/h/a.html?q=1#hash"
   * ```
   */
  resource: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * pathname:                                         "/p/a/t/h/a.html"
   * ```
   */
  pathname: string
  /**
   * ```
   * uri      : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * directory:                                         "/p/a/t/h/"
   * ```
   */
  directory: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * filename:                                                  "a.html"
   * ```
   */
  filename: string
  /**
   * ```
   * uri   : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * suffix:                                                    "html"
   * ```
   */
  suffix: string
  /**
   * ```
   * uri  : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * query:                                                         "q=1"
   * ```
   */
  query: string
  /**
   * ```
   * uri     : "https://user:pass@sub1.sub2.dom.com:8080/p/a/t/h/a.html?q=1#hash"
   * fragment:                                                             "hash"
   * ```
   */
  fragment: string
  queryParams: URLSearchParams
}

/**
 * Splits any URI into its parts.
 *
 * @param {string} uri
 * @param {'default' | 'friendly'} [mode] Parsing mode. Default follows official URI rules.
 * Friendly handles human-friendly URLs like `'example.com/index.html'` as expected.
 * @returns {ParseUriObject} Object with URI parts, plus `queryParams`.
 */
export function parseUri(uri: string, mode: 'default' | 'friendly' = 'default'): ParseUriObject {
  uri = uri.trim()
  const { groups } = cache.parser[mode as any].exec(uri)
  const { hasAuth, ...result } = {
    href: uri,
    ...groups,
    // URNs: If we have an authority (contained in `hasAuth`), keep dir/file, else remove because
    // they don't apply. `hasAuth` indicates participation in the match, but it could be empty
    ...(groups.protocol && groups.hasAuth == null ? blankUrnProps : null),
  }
  // Replace `undefined` for non-participating capturing groups
  Object.keys(result).forEach((key) => (result[key] ??= ''))
  return Object.assign(result, {
    ...cache.tlds?.exec(result.hostname)?.groups,
    queryParams: new URLSearchParams(`?${result.query}`),
  })
}

parseUri.dir = (path: string) => parseUri(path).directory

const blankUrnProps = {
  directory: '',
  filename: '',
  suffix: '',
}

function getParser(mode: 'default' | 'friendly'): RegExp {
  // Forward and backslashes have lost all meaning for web protocols (http, https, ws, wss, ftp)
  // and protocol-relative URLs. Also handle multiple colons in protocol delimiter for security
  const authorityDelimiter = String.raw`(?:(?:(?<=^(?:https?|wss?|ftp):):*|^:+)[\\/]*|^[\\/]{2,}|//)`
  const authority = {
    default: { start: `(?<hasAuth>${authorityDelimiter}`, end: ')?' },
    friendly: { start: `(?<hasAuth>${authorityDelimiter}?)`, end: '' },
  }
  // See file: free-spacing-regex.md
  return RegExp(
    String.raw`^(?<origin>(?:(?<protocol>[a-z][^\s:@\\/?#.]*):)?${authority[mode].start}(?<authority>(?:(?<userinfo>(?<username>[^:@\\/?#]*)(?::(?<password>[^\\/?#]*))?)?@)?(?<host>(?<hostname>\d{1,3}(?:\.\d{1,3}){3}(?=[:\\/?#]|$)|\[[a-f\d]{0,4}(?::[a-f\d]{0,4}){2,7}(?:%[^\]]*)?\]|(?<subdomain>[^:\\/?#]*?)\.??(?<domain>(?:[^.:\\/?#]*\.)?(?<tld>[^.:\\/?#]*))(?=[:\\/?#]|$))?(?::(?<port>[^:\\/?#]*))?))${authority[mode].end})(?<resource>(?<pathname>(?<directory>(?:[^\\/?#]*[\\/])*)(?<filename>(?:[^.?#]+|\.(?![^.?#]+(?:[?#]|$)))*(?:\.(?<suffix>[^.?#]+))?))(?:\?(?<query>[^#]*))?(?:\#(?<fragment>.*))?)`,
    'i',
  )
}

const cache = {
  tlds: null as RegExp,
  parser: {
    default: getParser('default'),
    friendly: getParser('friendly'),
  },
}

/**
Set second-level domains recognized as part of the TLD (ex: co.uk).
@param {Object} obj Object with TLDs as keys and their SLDs as space-separated strings.
@example
setTlds({
  au: 'com edu gov id net org',
  uk: 'co gov me net org sch',
});
*/
function setTlds(obj: Record<string, string>) {
  const entries = Object.entries(obj)
  let parser
  if (entries.length) {
    const tlds = entries
      .map(([key, value]) => `(?:${value.trim().replace(/\s+/g, '|').replace(/\./g, '\\.')})\\.${key}`)
      .join('|')
    parser = RegExp(`^(?<subdomain>.*?)\\.??(?<domain>(?:[^.]*\\.)?(?<tld>${tlds}))$`, 'is')
  }
  cache.tlds = parser
}

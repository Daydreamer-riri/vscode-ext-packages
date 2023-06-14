import type { RequestOptions } from 'node:https'
import https from 'node:https'
import http from 'node:http'

export function fetch(url: string, options?: RequestOptions): Promise<Record<string, any>> {
  const client = url.startsWith('https:') ? https : http
  const opts = { headers: { 'Content-Type': 'application/json' }, ...options }
  return new Promise((resolve, reject) => {
    const req = client.request(url, opts, (res: any) => {
      const { statusCode, headers } = res
      if (statusCode && statusCode >= 200 && statusCode < 300) {
        let data = ''
        res.on('data', (chunk: string) => data += chunk)
          .on('end', () => {
            try {
              const json = JSON.parse(data)
              resolve(json)
            }
            catch (e) {
              reject(e)
            }
          })
          .on('error', (e: any) => reject(e))
      }
      else if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
        // follow redirects
        // The location for some (most) redirects will only contain the path,  not the hostname;
        // detect this and add the host to the path.
        const withHost = /http(s?):/.test(headers.location)
        const redirectUrl = withHost
          ? headers.location
          : new URL(headers.location, req.getHeader('host') as string).href
        fetch(redirectUrl, options).then(resolve, reject)
      }
      else {
        reject(res)
      }
    },
    )
    req.end()
  })
}

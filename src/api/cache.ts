import { resolve } from 'node:path'
import os from 'node:os'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { ttl } from '../utils/ttl'

const cacheDir = resolve(os.tmpdir(), 'vscode-ext-packages')
const cachePath = resolve(cacheDir, 'cache.json')
const cacheMaxExpire = 7 * 24 * 60 * 60_000 // 7day

export function loadCache() {
  let cache: Record<string, { cacheTime: number, data: string[] }> = {}
  if (!existsSync(cachePath))
    return cache

  try {
    cache = JSON.parse(readFileSync(cachePath, 'utf-8'))
    const cacheEntries = Object.entries(cache)
    for (const [key, { cacheTime }] of cacheEntries) {
      if (ttl(cacheTime) > cacheMaxExpire)
        delete cache[key]
    }
  }
  catch (e) {
    console.error(e)
  }
  return cache
}

export function dumpCache(mCache: Record<string, string[]>, cacheChanged: boolean) {
  if (!cacheChanged)
    return
  try {
    const cache: Record<string, { cacheTime: number, data: string[] }> = {}
    for (const [key, val] of Object.entries(mCache))
      cache[key] = { cacheTime: Date.now(), data: val }

    mkdirSync(cacheDir, { recursive: true })
    writeFileSync(cachePath, JSON.stringify(cache), 'utf-8')
    console.log(`cache saved to ${cachePath}`)
  }
  catch (err) {
    console.warn('Failed to save cache')
    console.warn(err)
  }
}

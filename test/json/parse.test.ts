import fs from 'node:fs'
import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { parseJson } from '../../src/json/parse'

const expected = {
  '@actuallyworks/node-fetch': '^2.6.0',
  '@babel/cli': '^7.10.5',
  '@rollup/plugin-babel': '^6.0.3',
  'abortcontroller-polyfill': '^1.7.5',
  'art': '0.10.1',
  'babel-plugin-syntax-trailing-function-commas': '^6.5.0',
  'chalk': '^3.0.0',
  'eslint': '^7.7.0',
  'eslint-config-prettier': '^6.9.0',
  'eslint-plugin-react-internal': 'link:./scripts/eslint-rules',
  'fbjs-scripts': '^3.0.1',
  'filesize': '^6.0.1',
  'flow-bin': '^0.209.0',
  'flow-remove-types': '^2.209.0',
  'glob': '^7.1.6',
  'glob-stream': '^6.1.0',
  'google-closure-compiler': '^20230206.0.0',
  'gzip-size': '^5.1.1',
  'hermes-eslint': '^0.9.0',
  'hermes-parser': '^0.9.0',
  'jest': '^29.4.2',
  'jest-cli': '^29.4.2',
  'prettier': '2.8.3',
  'webpack': '^4.41.2',
  'yargs': '^15.3.1',
}
    type Keys = keyof typeof expected

describe('parser Tests', () => {
  const jsonFile = Buffer.from(fs.readFileSync('./test/json/package.test.json')).toString()

  it('read File', () => {
    expect(jsonFile).not.toBe(undefined)
  })

  it('read JSON', () => {
    const items = parseJson(jsonFile)

    expect(items.length).toStrictEqual(Object.keys(expected).length)

    const actual: string[] = []
    Object.keys(expected).forEach((key, index) => {
      const item = items[index]
      expect(item, `Undefined item at ${index}`).not.toEqual(undefined)
      actual.push(key)
    })
    expect(actual.length).toBe(items.length)
  })

  it('test dependencies', () => {
    const items = parseJson(jsonFile)

    Object.keys(expected).forEach((key, index) => {
      const item = items[index]
      expect(item).not.toEqual(undefined)
      expect(item.key).toBe(key.replace(/\s/g, ''))
      expect(item.value).toBe(expected[key as Keys])
      expect(jsonFile.substring(item.start + 1, item.start + 1 + expected[key as Keys].length)).toBe(item.value)
    })
  })
})

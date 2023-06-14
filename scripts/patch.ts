import fs from 'node:fs'
import path from 'node:path'

const origin = 'require.resolve("node-gyp/bin/node-gyp.js")'
const patched = '""'
const targetPath = path.resolve(__dirname, '../dist/index.js')
const content = fs.readFileSync(targetPath, 'utf-8')
fs.writeFileSync(targetPath, content.replace(origin, patched))

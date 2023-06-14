import { exec } from 'node:child_process'

export async function execCmd(cmd: string, cwd: string) {
  const result = await new Promise<string | undefined>((resolve, reject) => {
    exec(cmd, { cwd }, (e: Error | null, output: string) => {
      if (e) {
        reject(e)
      }
      else {
        const result = output.trim() === 'undefined' ? undefined : output.trim()
        resolve(result)
      }
    })
  })
  return result
}

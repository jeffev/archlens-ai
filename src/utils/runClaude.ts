import { spawn } from 'child_process'

export function runClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['--print'], {
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    child.stdin!.write(prompt, 'utf-8')
    child.stdin!.end()

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
      process.stdout.write('.')
    })

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error('Timeout: claude took more than 5 minutes'))
    }, 5 * 60 * 1000)

    child.on('close', (code: number | null) => {
      clearTimeout(timeout)
      process.stdout.write('\n')
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`claude exited with code ${code}.\n${stderr.slice(0, 500) || 'No stderr'}`))
      }
    })

    child.on('error', (err: Error) => {
      clearTimeout(timeout)
      reject(new Error(`Could not run "claude": ${err.message}`))
    })
  })
}

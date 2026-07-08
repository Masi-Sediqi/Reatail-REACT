import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))

const commands = [
  ['storage', process.execPath, ['server/json-storage-server.mjs']],
  ['vite', process.execPath, [viteBin]],
]

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (chunk) => process.stdout.write(`[${name}] ${chunk}`))
  child.stderr.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`))
  child.on('exit', (code) => {
    if (code && code !== 0) process.exitCode = code
  })
  return child
})

const shutdown = () => {
  children.forEach((child) => child.kill())
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

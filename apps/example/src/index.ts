import { runDemo } from './demo.js'

void runDemo().catch((err: unknown) => {
  console.error('\nSmoke test gagal:', err)
  process.exitCode = 1
})
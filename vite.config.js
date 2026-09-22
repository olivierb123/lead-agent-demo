import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Under WSL2, the agent backend (a Windows-native process) isn't reachable via
// "localhost" from inside the WSL network namespace — resolve the Windows
// host's gateway IP instead. Falls back to localhost when not running in WSL.
function resolveAgentHost() {
  try {
    const route = execSync("ip route show default", { encoding: 'utf8' })
    const match = route.match(/default via (\S+)/)
    if (match) return match[1]
  } catch {
    // not on Linux/WSL, or `ip` unavailable
  }
  return 'localhost'
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/responses': `http://${resolveAgentHost()}:8088`,
    },
  },
})
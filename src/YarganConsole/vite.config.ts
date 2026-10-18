import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

// Arayüz API'lere /svc/<servis> önekiyle aynı origin üzerinden gider.
// Geliştirmede bu proxy, Docker'da nginx (nginx/default.conf.template) aynı işi yapar.
const services = {
  device: { env: 'DEVICE_API_URL', fallback: 'http://localhost:5098' },
  rule: { env: 'RULE_API_URL', fallback: 'http://localhost:5165' },
  satops: { env: 'SATOPS_API_URL', fallback: 'http://localhost:5131' },
  user: { env: 'USER_API_URL', fallback: 'http://localhost:5050' },
  login: { env: 'LOGIN_API_URL', fallback: 'http://localhost:5002' },
} as const

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy: Record<string, ProxyOptions> = {}
  for (const [name, { env: key, fallback }] of Object.entries(services)) {
    const prefix = `/svc/${name}`
    proxy[prefix] = {
      target: env[key] || fallback,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.slice(prefix.length) || '/',
    }
  }
  // Mosquitto'nun websocket dinleyicisi (mosquitto.conf: listener 9001 / protocol websockets)
  proxy['/mqtt'] = { target: env.MQTT_WS_URL || 'ws://localhost:9001', ws: true, changeOrigin: true }

  return {
    plugins: [react()],
    server: { port: 5174, proxy },
    preview: { port: 4174, proxy },
    build: { chunkSizeWarningLimit: 900 },
  }
})

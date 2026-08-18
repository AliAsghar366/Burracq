import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

// Serve the Netlify Functions in netlify/functions/*.js during `npm run dev`
// so PayPal checkout (and any future function-backed flow) works locally
// without needing `netlify dev`. The functions read PAYPAL_* from the
// environment, which Vite loads from .env via loadEnv below.
function netlifyFunctions(): Plugin {
  return {
    name: 'netlify-functions',
    configureServer(server) {
      // Expose .env values to the functions (they read process.env, not
      // import.meta.env). Don't clobber variables already set in the shell.
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const match = url.pathname.match(/^\/\.netlify\/functions\/([A-Za-z0-9_-]+)$/)
        if (!match) return next()

        const name = match[1]
        const file = join(process.cwd(), 'netlify', 'functions', `${name}.js`)
        if (!existsSync(file)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `Function ${name} not found` }))
          return
        }

        try {
          // Collect the request body (functions expect event.body as a string).
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const body = Buffer.concat(chunks).toString('utf8')

          // Fresh import per request (cache-busted) so edits pick up instantly.
          const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`)
          const event = {
            httpMethod: req.method ?? 'GET',
            path: url.pathname,
            headers: req.headers,
            queryStringParameters: Object.fromEntries(url.searchParams),
            body,
          }
          const result = await mod.handler(event)
          res.statusCode = result.statusCode ?? 200
          for (const [key, value] of Object.entries(result.headers ?? {})) {
            res.setHeader(key, String(value))
          }
          res.end(
            typeof result.body === 'string'
              ? result.body
              : JSON.stringify(result.body ?? '')
          )
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({ error: err instanceof Error ? err.message : String(err) })
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), netlifyFunctions()],
})

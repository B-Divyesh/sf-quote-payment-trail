import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

interface RoutePolicy { route: string; headers?: Record<string, string> }
interface StaticConfig {
  routes: RoutePolicy[]
  globalHeaders: Record<string, string>
  mimeTypes: Record<string, string>
}

const config = JSON.parse(await readFile(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8')) as StaticConfig

describe('production response policy', () => {
  it('sets immutable assets and non-cacheable service worker policies', () => {
    expect(config.routes.find(({ route }) => route === '/assets/*')?.headers?.['Cache-Control']).toContain('immutable')
    expect(config.routes.find(({ route }) => route === '/sw.js')?.headers?.['Cache-Control']).toContain('no-cache')
  })

  it('sets manifest MIME and browser security boundaries', () => {
    expect(config.mimeTypes['.webmanifest']).toBe('application/manifest+json')
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()')
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY')
  })
})

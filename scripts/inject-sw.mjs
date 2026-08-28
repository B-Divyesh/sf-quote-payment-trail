import { mkdir, readFile, writeFile } from 'node:fs/promises'

const indexUrl = new URL('../dist/index.html', import.meta.url)
let html = await readFile(indexUrl, 'utf8')
const scriptPath = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)?.[1]
const stylePath = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/)?.[1]
if (!scriptPath || !stylePath) throw new Error('Could not find Vite assets for the service worker')
for (const route of ['privacy', 'terms', 'demo']) {
  const routeUrl = new URL(`../dist/${route}/`, import.meta.url)
  await mkdir(routeUrl, { recursive: true })
  await writeFile(new URL('index.html', routeUrl), html, 'utf8')
}
const swUrl = new URL('../dist/sw.js', import.meta.url)
const sw = await readFile(swUrl, 'utf8')
await writeFile(swUrl, sw.replace("'__BUILD_ASSETS__'", `'${scriptPath}', '${stylePath}'`), 'utf8')

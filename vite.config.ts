import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'
// @ts-ignore 설정 파일만 Node 에서 실행된다(앱 tsconfig 는 Workers 타입만 사용)
import { createHash } from 'node:crypto'
// @ts-ignore 위와 같음
import { existsSync, readFileSync } from 'node:fs'

// 브라우저 경험 번들의 내용 해시로 ?v= 를 붙인다(고정 번호 대신 — 바뀌면 바로 새 파일)
const experiencePath = 'public/static/experience/main.js'
const experienceVersion = existsSync(experiencePath) ? createHash('sha256').update(readFileSync(experiencePath)).digest('hex').slice(0, 10) : 'dev'

export default defineConfig({
  define: { __EXPERIENCE_V__: JSON.stringify(experienceVersion) },
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ]
})

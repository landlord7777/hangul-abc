// 앱의 문구 데이터(src/content/script.ts)에서 Vrew에 붙여넣을 더빙 대본 파일을 만드는 도구
// 사용법 (프로젝트 루트): node tools/voice/make-script.mjs
// 결과: voice/full/<언어>-<번호>.txt (Vrew에 붙여넣을 글, 50줄씩)
//       영어처럼 Vrew용 글이 앱 문구와 다르면 <언어>-<번호>.keys.txt (자르기 도구가 짝을 맞출 때 쓰는 앱 문구)
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'

const CHUNK = 50
const OUT = join(process.cwd(), 'voice', 'full')

const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { scriptPhrases } = await server.ssrLoadModule('/src/content/script.ts')
const phrases = scriptPhrases()
await server.close()

mkdirSync(OUT, { recursive: true })
for (const f of readdirSync(OUT)) if (f.endsWith('.txt')) rmSync(join(OUT, f))

// 영어는 끝에 마침표가 있어야 발음이 또렷하다 (시험 결과). 한국어는 차이가 없어 그대로 둔다.
const forVrew = (lang, text) => (lang === 'en' && !/[.!?]$/.test(text) ? `${text}.` : text)

for (const [lang, lines] of Object.entries(phrases)) {
  for (let k = 0; k * CHUNK < lines.length; k++) {
    const keys = lines.slice(k * CHUNK, (k + 1) * CHUNK)
    const name = `${lang}-${String(k + 1).padStart(2, '0')}`
    const vrew = keys.map((t) => forVrew(lang, t))
    writeFileSync(join(OUT, `${name}.txt`), vrew.join('\n') + '\n', 'utf8')
    if (vrew.some((t, i) => t !== keys[i])) writeFileSync(join(OUT, `${name}.keys.txt`), keys.join('\n') + '\n', 'utf8')
    console.log(`${name}.txt  ${keys.length}줄`)
  }
  console.log(`${lang}: 모두 ${lines.length}줄`)
}

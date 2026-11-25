// 앱의 문구 데이터(src/content/script.ts)에서 Vrew에 붙여넣을 더빙 대본 파일을 만드는 도구
// 사용법 (프로젝트 루트): node tools/voice/make-script.mjs [ko|en]  (언어를 주면 그 언어 대본만 다시 만든다)
// 결과: voice/full/<언어>-<번호>.txt (Vrew에 붙여넣을 글, 50줄씩)
//       Vrew용 글이 앱 문구와 다르면(끝 마침표) <언어>-<번호>.keys.txt (자르기 도구가 짝을 맞출 때 쓰는 앱 문구)
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'

const CHUNK = 50
const OUT = join(process.cwd(), 'voice', 'full')

const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { scriptPhrases } = await server.ssrLoadModule('/src/content/script.ts')
const phrases = scriptPhrases()
await server.close()

const only = process.argv[2]
const langs = Object.keys(phrases).filter((l) => !only || l === only)

mkdirSync(OUT, { recursive: true })
for (const f of readdirSync(OUT)) if (f.endsWith('.txt') && langs.some((l) => f.startsWith(`${l}-`))) rmSync(join(OUT, f))

// 줄 끝에 문장 부호를 붙인다. 영어는 발음이 또렷해지고(시험 결과), 부호가 없으면 Vrew가 다음 줄과
// 한 클립으로 이어 읽어 자를 수 없게 된다(전체 대본 1차 더빙에서 한국어가 그랬다).
const forVrew = (text) => (/[.!?]$/.test(text) ? text : `${text}.`)

for (const lang of langs) {
  const lines = phrases[lang]
  for (let k = 0; k * CHUNK < lines.length; k++) {
    const keys = lines.slice(k * CHUNK, (k + 1) * CHUNK)
    const name = `${lang}-${String(k + 1).padStart(2, '0')}`
    const vrew = keys.map(forVrew)
    writeFileSync(join(OUT, `${name}.txt`), vrew.join('\n') + '\n', 'utf8')
    if (vrew.some((t, i) => t !== keys[i])) writeFileSync(join(OUT, `${name}.keys.txt`), keys.join('\n') + '\n', 'utf8')
    console.log(`${name}.txt  ${keys.length}줄`)
  }
  console.log(`${lang}: 모두 ${lines.length}줄`)
}

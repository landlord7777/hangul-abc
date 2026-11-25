// 앱의 문구 데이터(src/content/script.ts)에서 Vrew에 붙여넣을 더빙 대본 파일을 만드는 도구
// 사용법 (프로젝트 루트): node tools/voice/make-script.mjs [ko|en] [--all]
//   기본: 아직 음성이 없는(voices.json에 없는) 문구만 모아 다음 번호 파일(예: ko-05.txt)로 만든다.
//         이미 더빙한 대본 파일은 건드리지 않는다.
//   --all: 그 언어의 대본을 모두 지우고 처음부터 다시 만든다 (전체를 새로 더빙할 때).
//   언어를 주면 그 언어만 만든다.
// 결과: voice/full/<언어>-<번호>.txt (Vrew에 붙여넣을 글, 50줄씩)
//       Vrew용 글이 앱 문구와 다르면(끝 마침표) <언어>-<번호>.keys.txt (자르기 도구가 짝을 맞출 때 쓰는 앱 문구)
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'

const CHUNK = 50
const OUT = join(process.cwd(), 'voice', 'full')
const VOICES = join(process.cwd(), 'src', 'content', 'voices.json')

const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { scriptPhrases } = await server.ssrLoadModule('/src/content/script.ts')
const phrases = scriptPhrases()
await server.close()

const args = process.argv.slice(2)
const all = args.includes('--all')
const only = args.find((a) => !a.startsWith('--'))
const langs = Object.keys(phrases).filter((l) => !only || l === only)
const voices = JSON.parse(readFileSync(VOICES, 'utf8'))

mkdirSync(OUT, { recursive: true })
if (all) for (const f of readdirSync(OUT)) if (f.endsWith('.txt') && langs.some((l) => f.startsWith(`${l}-`))) rmSync(join(OUT, f))

// 줄 끝에 문장 부호를 붙인다. 영어는 발음이 또렷해지고(시험 결과), 부호가 없으면 Vrew가 다음 줄과
// 한 클립으로 이어 읽어 자를 수 없게 된다(전체 대본 1차 더빙에서 한국어가 그랬다).
const forVrew = (text) => (/[.!?]$/.test(text) ? text : `${text}.`)

for (const lang of langs) {
  const lines = all ? phrases[lang] : phrases[lang].filter((t) => !voices[`${lang}:${t}`])
  if (!lines.length) {
    console.log(`${lang}: 새로 더빙할 문구가 없습니다.`)
    continue
  }
  // 이어 붙일 때는 이미 있는 대본 파일 다음 번호부터 쓴다.
  const used = readdirSync(OUT).map((f) => f.match(new RegExp(`^${lang}-(\\d+)\\.txt$`))?.[1]).filter(Boolean).map(Number)
  const first = all ? 1 : Math.max(0, ...used) + 1
  for (let k = 0; k * CHUNK < lines.length; k++) {
    const keys = lines.slice(k * CHUNK, (k + 1) * CHUNK)
    const name = `${lang}-${String(first + k).padStart(2, '0')}`
    const vrew = keys.map(forVrew)
    writeFileSync(join(OUT, `${name}.txt`), vrew.join('\n') + '\n', 'utf8')
    if (vrew.some((t, i) => t !== keys[i])) writeFileSync(join(OUT, `${name}.keys.txt`), keys.join('\n') + '\n', 'utf8')
    console.log(`${name}.txt  ${keys.length}줄`)
  }
  console.log(`${lang}: ${all ? '모두' : '새 문구'} ${lines.length}줄`)
}

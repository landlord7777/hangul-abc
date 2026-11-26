// 앱의 문구 데이터(src/content/script.ts)에서 Vrew에 붙여넣을 더빙 대본 파일을 만드는 도구
// 사용법 (프로젝트 루트): node tools/voice/make-script.mjs [ko|en] [--all]
//   기본: 아직 음성이 없는(voices.json에 없는) 문구만 모아 다음 번호 파일(예: ko-short-02.txt)로 만든다.
//         이미 더빙한 대본 파일은 건드리지 않는다.
//   --all: 그 언어의 대본을 모두 지우고 처음부터 다시 만든다 (전체를 새로 더빙할 때).
//   언어를 주면 그 언어만 만든다.
// 결과: voice/full/<언어>-<short|long>-<번호>.txt (Vrew에 붙여넣을 글)
//       short(자모·글자·낱말)와 long(요정 대사·문장)은 Vrew에서 속도를 다르게 더빙하므로 파일을 나눈다.
//       Vrew용 글이 앱 문구와 다르면(끝 부호) 같은 이름의 .keys.txt (자르기 도구가 짝을 맞출 때 쓰는 앱 문구)
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'vite'

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

// 줄 끝에 부호를 붙인다. 부호가 없으면 Vrew가 다음 줄과 한 클립으로 이어 읽어 자를 수 없게 된다
// (전체 대본 1차 더빙에서 한국어가 그랬다). 짧은 소리는 마침표(영어는 발음이 또렷해진다, 시험 결과).
// 긴 문장은 마침표로 끝나면 목소리가 딱딱해서 물결로 바꾼다(사용자 시험 결과). !와 ?는 그대로 둔다.
const forVrew = (text, kind) => {
  if (/[!?~]$/.test(text)) return text
  if (kind === 'short') return /\.$/.test(text) ? text : `${text}.`
  return `${text.replace(/\.$/, '')}~`
}

for (const lang of langs) {
  for (const kind of ['short', 'long']) {
    const lines = all ? phrases[lang][kind] : phrases[lang][kind].filter((t) => !voices[`${lang}:${t}`])
    if (!lines.length) {
      console.log(`${lang}-${kind}: 새로 더빙할 문구가 없습니다.`)
      continue
    }
    // 이어 붙일 때는 이미 있는 대본 파일 다음 번호부터 쓴다.
    const re = new RegExp(`^${lang}-${kind}-(\\d+)\\.txt$`)
    const used = readdirSync(OUT).map((f) => f.match(re)?.[1]).filter(Boolean).map(Number)
    const name = `${lang}-${kind}-${String(all ? 1 : Math.max(0, ...used) + 1).padStart(2, '0')}`
    const vrew = lines.map((t) => forVrew(t, kind))
    writeFileSync(join(OUT, `${name}.txt`), vrew.join('\n') + '\n', 'utf8')
    if (vrew.some((t, i) => t !== lines[i])) writeFileSync(join(OUT, `${name}.keys.txt`), lines.join('\n') + '\n', 'utf8')
    console.log(`${name}.txt  ${lines.length}줄 (${all ? '모두' : '새 문구'})`)
  }
}

// 한글 자모를 음절로 합치고 음절을 자모로 나누는 유니코드 계산 함수
export const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
export const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
export const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

const BASE = 0xac00

export function isConsonant(c: string) {
  return CHO.includes(c)
}

export function isVowel(c: string) {
  return JUNG.includes(c)
}

/** 초성·중성(·종성)을 한 음절로 합친다. 합칠 수 없으면 null. */
export function compose(cho: string, jung: string, jong = ''): string | null {
  const i = CHO.indexOf(cho)
  const m = JUNG.indexOf(jung)
  const f = JONG.indexOf(jong)
  if (i < 0 || m < 0 || f < 0) return null
  return String.fromCharCode(BASE + (i * 21 + m) * 28 + f)
}

/** 음절을 [초성, 중성, 종성]으로 나눈다. 한글 음절이 아니면 null. */
export function decompose(syllable: string): [string, string, string] | null {
  const code = syllable.charCodeAt(0) - BASE
  if (syllable.length !== 1 || code < 0 || code > 11171) return null
  return [CHO[Math.floor(code / 588)], JUNG[Math.floor((code % 588) / 28)], JONG[code % 28]]
}

/** 자음은 "자음+ㅡ"로 소리를 낸다. ㄱ → 그 */
export function consonantSound(c: string) {
  return compose(c, 'ㅡ') ?? c
}

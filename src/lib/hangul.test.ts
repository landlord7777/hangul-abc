// 한글 자모 조합·분해 함수의 테스트
import { describe, expect, it } from 'vitest'
import { compose, consonantSound, decompose } from './hangul'

describe('compose', () => {
  it('초성과 중성을 합친다', () => {
    expect(compose('ㄱ', 'ㅏ')).toBe('가')
    expect(compose('ㄴ', 'ㅗ')).toBe('노')
    expect(compose('ㅎ', 'ㅣ')).toBe('히')
    expect(compose('ㅇ', 'ㅡ')).toBe('으')
  })

  it('종성까지 합친다', () => {
    expect(compose('ㄱ', 'ㅗ', 'ㅁ')).toBe('곰')
    expect(compose('ㄷ', 'ㅏ', 'ㄺ')).toBe('닭')
  })

  it('잘못된 자모는 null', () => {
    expect(compose('ㅏ', 'ㄱ')).toBeNull()
    expect(compose('a', 'ㅏ')).toBeNull()
    expect(compose('ㄱ', 'ㅏ', 'ㄸ')).toBeNull()
  })
})

describe('decompose', () => {
  it('음절을 나눈다', () => {
    expect(decompose('가')).toEqual(['ㄱ', 'ㅏ', ''])
    expect(decompose('닭')).toEqual(['ㄷ', 'ㅏ', 'ㄺ'])
    expect(decompose('힣')).toEqual(['ㅎ', 'ㅣ', 'ㅎ'])
  })

  it('한글 음절이 아니면 null', () => {
    expect(decompose('ㄱ')).toBeNull()
    expect(decompose('a')).toBeNull()
    expect(decompose('가나')).toBeNull()
  })

  it('compose와 서로 되돌린다', () => {
    for (const s of ['나', '무', '토', '끼', '뷁']) {
      const [c, v, f] = decompose(s)!
      expect(compose(c, v, f)).toBe(s)
    }
  })
})

it('자음 소리는 ㅡ를 붙여 읽는다', () => {
  expect(consonantSound('ㄱ')).toBe('그')
  expect(consonantSound('ㄲ')).toBe('끄')
})

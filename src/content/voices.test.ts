// 더빙 목록(voices.json)이 가리키는 음성 파일이 실제로 있는지 검사하는 테스트
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import VOICE_FILES from './voices.json'

it('목록의 모든 더빙 파일이 public/에 있다', () => {
  for (const [key, file] of Object.entries(VOICE_FILES)) {
    expect(key).toMatch(/^(ko|en):./)
    expect(existsSync(resolve(__dirname, '../../public', file)), file).toBe(true)
  }
})

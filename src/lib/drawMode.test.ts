// 펜슬 모드 / 손가락 모드의 입력 허용 규칙(손바닥 무시, 펜슬 우선) 테스트
import { expect, it } from 'vitest'
import { acceptPointer } from './drawMode'

it('펜슬 모드는 펜슬만 받는다', () => {
  expect(acceptPointer('pen', 'pen', null)).toBe(true)
  expect(acceptPointer('pen', 'touch', null)).toBe(false)
})

it('손가락 모드는 둘 다 받는다', () => {
  expect(acceptPointer('finger', 'touch', null)).toBe(true)
  expect(acceptPointer('finger', 'pen', null)).toBe(true)
})

it('그리는 중에는 두 번째 터치를 무시하지만, 손 터치 중 펜슬은 넘겨받는다', () => {
  expect(acceptPointer('finger', 'touch', 'touch')).toBe(false)
  expect(acceptPointer('finger', 'pen', 'touch')).toBe(true)
  expect(acceptPointer('finger', 'touch', 'pen')).toBe(false)
  expect(acceptPointer('pen', 'pen', 'pen')).toBe(false)
})

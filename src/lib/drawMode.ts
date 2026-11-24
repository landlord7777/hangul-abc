// 펜슬 모드(펜슬만) / 손가락 모드(펜슬·손가락) 설정을 읽고 쓰는 함수 — 따라 쓰기와 기기 확인 화면이 함께 쓴다
export type DrawMode = 'pen' | 'finger'

const MODE_KEY = 'settings.drawMode'

export function loadMode(): DrawMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'finger' ? 'finger' : 'pen'
  } catch {
    return 'pen'
  }
}

export function saveMode(m: DrawMode) {
  try {
    localStorage.setItem(MODE_KEY, m)
  } catch {
    // 저장 실패 시 이번 실행 동안만 적용된다.
  }
}

/**
 * 이 입력으로 선을 그려도 되는지 판단한다.
 * 펜슬 모드에서는 펜슬이 아닌 입력(손가락·손바닥)을 무시한다.
 * 이미 그리는 중이면 무시하되, 손 터치로 그리는 중에 펜슬이 오면 펜슬로 넘긴다.
 */
export function acceptPointer(mode: DrawMode, pointerType: string, activeType: string | null) {
  const takeOver = pointerType === 'pen' && activeType !== 'pen'
  return !((mode === 'pen' && pointerType !== 'pen') || (activeType !== null && !takeOver))
}

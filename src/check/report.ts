// 0단계 확인 결과를 모아 복사용 텍스트로 만드는 저장소
const items = new Map<string, string>()

export function setReport(key: string, value: string) {
  items.set(key, value)
}

export function reportText(): string {
  return [...items].map(([k, v]) => `${k}: ${v}`).join('\n')
}

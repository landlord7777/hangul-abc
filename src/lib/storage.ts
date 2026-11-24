// localStorage에 JSON 값을 안전하게 읽고 쓰는 도우미
export function load<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key)
    return s === null ? fallback : (JSON.parse(s) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간이 없거나 막혀 있으면 이번 실행 동안만 기억한다.
  }
}

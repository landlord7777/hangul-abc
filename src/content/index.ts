// 과목별 레벨 목록을 한곳에 모은다
import { EN_LEVELS } from './en'
import { KO_LEVELS } from './ko'
import type { Level, Subject } from './types'

export const LEVELS: Record<Subject, Level[]> = { ko: KO_LEVELS, en: EN_LEVELS }

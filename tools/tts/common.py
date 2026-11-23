# 음성 비교용 샘플 목록과 저장 도우미 (각 TTS 엔진 스크립트가 공통으로 사용)
import ctypes
import json
import sys
from pathlib import Path

import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'voice-samples'

KO = ['그', '윽', '기역', '나무', '고양이가 잠을 자요.']
EN = ['B', 'B, ball', 'cat', 'I see a red cat.']


def lower_priority():
    """다른 프로그램이 느려지지 않도록 이 프로세스의 우선순위를 '보통 미만'으로 낮춘다."""
    if sys.platform == 'win32':
        k = ctypes.windll.kernel32
        k.SetPriorityClass(k.GetCurrentProcess(), 0x4000)  # BELOW_NORMAL_PRIORITY_CLASS


def save(engine: str, entries: list[dict]):
    """entries: {voice, lang, text, audio, sr}. WAV와 목록 파일(<engine>.json)을 쓴다."""
    folder = OUT / engine
    folder.mkdir(parents=True, exist_ok=True)
    index = []
    for i, e in enumerate(entries):
        name = f"{e['lang']}-{e['voice']}-{i}.wav"
        sf.write(folder / name, e['audio'], e['sr'])
        index.append({'voice': e['voice'], 'lang': e['lang'], 'text': e['text'], 'file': f'{engine}/{name}'})
    (OUT / f'{engine}.json').write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{engine}: {len(index)}개 저장')

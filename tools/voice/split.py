# Vrew에서 내보낸 더빙 WAV를 무음 기준으로 대본 줄마다 잘라 앱용 음성 파일과 목록(voices.json)을 만드는 도구
"""
사용법 (프로젝트 루트에서)
  python tools/voice/split.py <wav> <대본.txt> <ko|en> <이름>

- 대본 한 줄 = 소리 덩어리 하나. 클립 사이 무음(기본 0.65초 이상)으로 자르고,
  0.1초보다 짧은 잡음은 버린다. 덩어리 수가 대본 줄 수와 다르면 아무것도 쓰지 않고 멈춘다.
- 결과: public/voice/<lang>/<이름>-NN.wav (24kHz 모노 16bit), src/content/voices.json 갱신
  (같은 이름으로 만든 이전 항목은 지우고 새로 쓴다)
"""
import argparse
import array
import json
import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT_RATE = 24000
WIN = 0.01  # 분석 단위 10ms
PAD = 0.06  # 앞뒤 여유
FADE = 0.008


def read_wav(path: Path):
    """PCM 16bit 또는 float 32bit WAV를 모노 float 배열로 읽는다."""
    b = path.read_bytes()
    if b[:4] != b'RIFF' or b[8:12] != b'WAVE':
        raise SystemExit(f'WAV 파일이 아닙니다: {path}')
    p, fmt, data = 12, None, None
    while p < len(b) - 8:
        cid, size = b[p:p + 4], struct.unpack('<I', b[p + 4:p + 8])[0]
        body = b[p + 8:p + 8 + size]
        if cid == b'fmt ':
            fmt = struct.unpack('<HHIIHH', body[:16])
        elif cid == b'data':
            data = body
        p += 8 + size + (size & 1)
    tag, ch, sr, _, _, bits = fmt
    if tag == 3 and bits == 32:
        a = array.array('f', data)
    elif tag == 1 and bits == 16:
        a = array.array('f', (x / 32768 for x in array.array('h', data)))
    else:
        raise SystemExit(f'지원하지 않는 형식: format={tag}, {bits}bit')
    if ch > 1:
        a = array.array('f', (sum(a[i:i + ch]) / ch for i in range(0, len(a), ch)))
    return sr, a


def find_segments(x, sr, min_gap, min_len):
    win = int(sr * WIN)
    rms = [math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, len(x) - win, win)]
    thr = max(rms) * 0.02
    # 1) 0.2초 무음으로 잘게 나눈 뒤 짧은 잡음을 버린다.
    segs, start, quiet = [], None, 0
    for i, r in enumerate(rms):
        if r > thr:
            if start is None:
                start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet >= 20:
                segs.append((start, i - quiet + 1))
                start, quiet = None, 0
    if start is not None:
        segs.append((start, len(rms)))
    segs = [(s, e) for s, e in segs if (e - s) * WIN >= min_len]
    # 2) 간격이 min_gap보다 짧은 덩어리는 한 줄(문장 안 쉼)로 합친다.
    merged = []
    for s, e in segs:
        if merged and (s - merged[-1][1]) * WIN < min_gap:
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))
    return [(s * win, e * win) for s, e in merged]


def write_clip(path: Path, x, sr, s, e):
    pad = int(sr * PAD)
    clip = list(x[max(0, s - pad):min(len(x), e + pad)])
    f = int(sr * FADE)
    for k in range(min(f, len(clip))):
        clip[k] *= k / f
        clip[-1 - k] *= k / f
    step = sr // OUT_RATE if sr % OUT_RATE == 0 else 1
    rate = sr // step
    out = [sum(clip[i:i + step]) / step for i in range(0, len(clip) - step + 1, step)]
    pcm = array.array('h', (max(-32768, min(32767, round(v * 32767))) for v in out))
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())
    return len(out) / rate


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('wav')
    ap.add_argument('script')
    ap.add_argument('lang', choices=['ko', 'en'])
    ap.add_argument('name')
    ap.add_argument('--min-gap', type=float, default=0.65, help='클립을 나누는 최소 무음(초)')
    ap.add_argument('--min-len', type=float, default=0.1, help='이보다 짧은 소리는 잡음으로 버림(초)')
    a = ap.parse_args()

    lines = [l.strip() for l in Path(a.script).read_text(encoding='utf-8-sig').splitlines() if l.strip()]
    sr, x = read_wav(Path(a.wav))
    segs = find_segments(x, sr, a.min_gap, a.min_len)
    print(f'{a.wav}: {len(x) / sr:.2f}초, 소리 덩어리 {len(segs)}개, 대본 {len(lines)}줄')
    for k, (s, e) in enumerate(segs):
        print(f'  {k + 1:2}. {s / sr:6.2f} - {e / sr:6.2f}  {lines[k] if k < len(lines) else "(대본에 없음)"}')
    if len(segs) != len(lines):
        raise SystemExit('덩어리 수와 대본 줄 수가 달라 멈춥니다. --min-gap 값을 바꾸거나 녹음을 확인하세요.')

    out_dir = ROOT / 'public' / 'voice' / a.lang
    for old in out_dir.glob(f'{a.name}-*.wav'):
        old.unlink()
    index_path = ROOT / 'src' / 'content' / 'voices.json'
    index = json.loads(index_path.read_text(encoding='utf-8')) if index_path.exists() else {}
    prefix = f'voice/{a.lang}/{a.name}-'
    index = {k: v for k, v in index.items() if not v.startswith(prefix)}
    for k, ((s, e), text) in enumerate(zip(segs, lines), 1):
        rel = f'{prefix}{k:02}.wav'
        write_clip(ROOT / 'public' / rel, x, sr, s, e)
        index[f'{a.lang}:{text}'] = rel
    index_path.write_text(json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(lines)}개 파일을 {out_dir}에 쓰고 {index_path.name}을 갱신했습니다.')


if __name__ == '__main__':
    main()

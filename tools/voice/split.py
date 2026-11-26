# Vrew에서 내보낸 더빙 WAV를 무음 기준으로 대본 줄마다 잘라 앱용 음성 파일과 목록(voices.json)을 만드는 도구
"""
사용법 (프로젝트 루트에서)
  python tools/voice/split.py <wav> <대본.txt> <ko|en> <이름>

- 대본 한 줄 = 소리 덩어리 하나. 클립 사이 무음(기본 0.65초 이상)으로 자르고,
  0.1초보다 짧은 잡음은 버린다. 덩어리 수가 대본 줄 수와 다르면 아무것도 쓰지 않고 멈춘다.
- WAV와 같은 이름의 .srt(Vrew 자막)가 있으면 무음 대신 자막 시간으로 자른다. 자막 경계는 앞뒤
  0.15초 안의 가장 조용한 곳으로 옮기고, 그곳도 조용하지 않으면(줄이 합쳐져 읽힌 경우) 멈춘다.
- 결과: public/voice/<lang>/<이름>-NN.wav (24kHz 모노 16bit), src/content/voices.json 갱신
  (같은 이름으로 만든 이전 항목은 지우고 새로 쓴다)
"""
import argparse
import array
import json
import math
import re
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


def frame_rms(x, sr):
    win = int(sr * WIN)
    return [math.sqrt(sum(v * v for v in x[i:i + win]) / win) for i in range(0, len(x) - win, win)]


def read_srt(path: Path):
    """Vrew 자막에서 (시작초, 끝초, 글) 목록을 읽는다."""
    t = lambda h, m, s, ms: int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000
    pat = r'(\d+):(\d\d):(\d\d)[,.](\d+) --> (\d+):(\d\d):(\d\d)[,.](\d+)[^\n]*\n(.*?)(?:\n\s*\n|\Z)'
    text = path.read_text(encoding='utf-8-sig').replace('\r\n', '\n').strip() + '\n\n'
    return [(t(*m[0:4]), t(*m[4:8]), ' '.join(m[8].split())) for m in re.findall(pat, text, re.S)]


def srt_segments(x, sr, entries):
    """자막 경계를 가장 조용한 곳으로 옮기고, 경계 사이에서 소리가 있는 부분을 (시작, 끝) 표본 위치로 돌려준다."""
    rms = frame_rms(x, sr)
    thr = max(rms) * 0.02
    n = len(rms)
    reach = round(0.15 / WIN)
    cuts, bad = [0], []
    for k, (s, _, text) in enumerate(entries[1:], 2):
        c = round(s / WIN)
        lo, hi = max(cuts[-1] + 1, c - reach), min(n - 1, c + reach)
        best = min(range(lo, hi + 1), key=lambda i: rms[i])
        if rms[best] > thr:
            bad.append(f'{k}번 "{text}" 앞 {s:.2f}초 근처에 쉬는 곳이 없음')
        cuts.append(best)
    cuts.append(n)
    if bad:
        raise SystemExit('자막 경계가 소리 중간에 있습니다 (앞 줄과 이어서 읽힌 것 같음).\n  ' + '\n  '.join(bad))
    segs = []
    for a, b in zip(cuts, cuts[1:]):
        loud = [i for i in range(a, b) if rms[i] > thr]
        if not loud:
            raise SystemExit(f'{len(segs) + 1}번 자막 구간에 소리가 없습니다.')
        segs.append((loud[0], loud[-1] + 1, a, b))
    win = int(sr * WIN)
    return [(s * win, e * win, a * win, b * win) for s, e, a, b in segs]


def find_segments(x, sr, min_gap, min_len):
    win = int(sr * WIN)
    rms = frame_rms(x, sr)
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
    return [(s * win, e * win, 0, len(x)) for s, e in merged]


def write_clip(path: Path, x, sr, s, e, lo, hi):
    """s~e 소리에 앞뒤 여유를 붙여 쓴다. 여유는 lo~hi(이웃 클립 경계)를 넘지 않는다."""
    pad = int(sr * PAD)
    clip = list(x[max(0, lo, s - pad):min(len(x), hi, e + pad)])
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
    ap.add_argument('--no-srt', action='store_true', help='.srt가 있어도 무음으로 자름 (자막 시간이 소리와 안 맞을 때)')
    a = ap.parse_args()

    # Vrew용 글과 앱 문구가 다르면(예: 영어 끝 마침표) 같은 이름의 .keys.txt에 앱 문구가 있다.
    script = Path(a.script)
    keys = script.with_name(script.stem + '.keys.txt')
    lines = [l.strip() for l in (keys if keys.exists() else script).read_text(encoding='utf-8-sig').splitlines() if l.strip()]
    sr, x = read_wav(Path(a.wav))
    srt = Path(a.wav).with_suffix('.srt')
    if srt.exists() and not a.no_srt:
        entries = read_srt(srt)
        said = [l.strip() for l in script.read_text(encoding='utf-8-sig').splitlines() if l.strip()]
        if len(entries) != len(lines):
            raise SystemExit(f'자막 {len(entries)}개와 대본 {len(lines)}줄의 수가 달라 멈춥니다.')
        diff = [f'{k}번 대본 "{w}" / 자막 "{t}"' for k, (w, (_, _, t)) in enumerate(zip(said, entries), 1) if w.rstrip('.~') != t.rstrip('.~')]
        if diff:
            raise SystemExit('자막 글이 대본과 달라 멈춥니다.\n  ' + '\n  '.join(diff))
        print(f'{srt.name} 자막 시간으로 자릅니다.')
        segs = srt_segments(x, sr, entries)
    else:
        segs = find_segments(x, sr, a.min_gap, a.min_len)
    print(f'{a.wav}: {len(x) / sr:.2f}초, 소리 덩어리 {len(segs)}개, 대본 {len(lines)}줄')
    for k, (s, e, _, _) in enumerate(segs):
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
    for k, ((s, e, lo, hi), text) in enumerate(zip(segs, lines), 1):
        rel = f'{prefix}{k:02}.wav'
        write_clip(ROOT / 'public' / rel, x, sr, s, e, lo, hi)
        index[f'{a.lang}:{text}'] = rel
    index_path.write_text(json.dumps(dict(sorted(index.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(lines)}개 파일을 {out_dir}에 쓰고 {index_path.name}을 갱신했습니다.')


if __name__ == '__main__':
    main()

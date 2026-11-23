# MeloTTS로 CPU에서 비교용 한국어·영어 샘플 음성을 만드는 스크립트
import tempfile
import time
from pathlib import Path

import soundfile as sf
import torch
from melo.api import TTS

from common import EN, KO, lower_priority, save

lower_priority()
torch.set_num_threads(3)

entries = []
tmp = Path(tempfile.mkdtemp())
for language, lang, speaker, texts in [('KR', 'ko', 'KR', KO), ('EN', 'en', 'EN-US', EN)]:
    model = TTS(language=language, device='cpu')
    sid = model.hps.data.spk2id[speaker]
    for text in texts:
        start = time.time()
        path = tmp / 'out.wav'
        model.tts_to_file(text, sid, str(path), speed=0.9)
        audio, sr = sf.read(path)
        print(f'{speaker} {text!r}: {time.time() - start:.1f}초')
        entries.append({'voice': speaker, 'lang': lang, 'text': text, 'audio': audio, 'sr': sr})

save('melo', entries)

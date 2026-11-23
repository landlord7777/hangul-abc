# Kokoro(영어 전용)로 CPU에서 비교용 영어 샘플 음성을 만드는 스크립트
import time

import numpy as np
import torch
from kokoro import KPipeline

from common import EN, lower_priority, save

lower_priority()
torch.set_num_threads(3)

pipeline = KPipeline(lang_code='a')
entries = []
for voice in ['af_heart', 'af_bella']:
    for text in EN:
        start = time.time()
        chunks = [np.asarray(audio) for _, _, audio in pipeline(text, voice=voice, speed=0.9)]
        print(f'{voice} {text!r}: {time.time() - start:.1f}초')
        entries.append({'voice': voice, 'lang': 'en', 'text': text, 'audio': np.concatenate(chunks), 'sr': 24000})

save('kokoro', entries)

# Qwen3-TTS(0.6B CustomVoice)로 CPU에서 비교용 샘플 음성을 만드는 스크립트
import time

import torch
from qwen_tts import Qwen3TTSModel

from common import EN, KO, lower_priority, save

lower_priority()
torch.set_num_threads(3)  # 4코어 중 1개는 다른 프로그램용으로 남긴다

INSTRUCT = 'Speak slowly, warmly and very clearly, like a kind teacher talking to a young child.'

model = Qwen3TTSModel.from_pretrained(
    'Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice',
    device_map='cpu',
    dtype=torch.float32,
)

jobs = [('Korean', 'ko', 'Sohee', t) for t in KO] + [('English', 'en', 'Aiden', t) for t in EN] + [
    ('English', 'en', 'Sohee', t) for t in EN
]
entries = []
for language, lang, speaker, text in jobs:
    start = time.time()
    wavs, sr = model.generate_custom_voice(text=text, language=language, speaker=speaker, instruct=INSTRUCT)
    print(f'{speaker} {text!r}: {time.time() - start:.1f}초')
    entries.append({'voice': speaker, 'lang': lang, 'text': text, 'audio': wavs[0], 'sr': sr})

save('qwen', entries)

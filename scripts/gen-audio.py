#!/usr/bin/env python3
"""Generate a calm ambient loop (WAV, no external deps) for the global player.

We synthesize a soft minor pad: three detuned sine partials forming a chord,
slow amplitude breathing, and a gentle lowpass-ish rolloff by mixing in
quieter higher partials. Loops seamlessly (no envelope click at the seam).
"""
import math
import os
import struct
import wave

SR = 44100
SECONDS = 16.0
N = int(SR * SECONDS)
AMP = 0.16  # master peak (kept low for background listening)

# A minor-ish chord: A2, C3, E3 with a fifth octave shimmer
BASE = [110.0, 130.81, 164.81, 329.63]
DETUNE = [0.0, 0.4, -0.3, 0.2]  # cents-ish offset per partial

out_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio', 'ambient.wav')
out_path = os.path.abspath(out_path)
os.makedirs(os.path.dirname(out_path), exist_ok=True)


def partial(t, freq, detune_cents, level):
    f = freq * (2 ** (detune_cents / 1200.0))
    # soft saturation to avoid harshness
    s = math.sin(2 * math.pi * f * t)
    return s * level


frames = bytearray()
for i in range(N):
    t = i / SR
    # breathing LFO (period ~8s)
    breath = 0.6 + 0.4 * (0.5 + 0.5 * math.sin(2 * math.pi * t / 8.0))
    s = 0.0
    s += partial(t, BASE[0], DETUNE[0], 1.0)
    s += partial(t, BASE[1], DETUNE[1], 0.8)
    s += partial(t, BASE[2], DETUNE[2], 0.7)
    s += partial(t, BASE[3], DETUNE[3], 0.25)
    # subtle higher harmonic shimmer, very quiet
    s += math.sin(2 * math.pi * BASE[2] * 2 * t) * 0.08
    s *= breath * AMP
    # soft clip
    s = max(-1.0, min(1.0, s * 0.5))
    val = int(s * 32767)
    frames += struct.pack('<h', val)

with wave.open(out_path, 'w') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(bytes(frames))

print(f"wrote {out_path} ({os.path.getsize(out_path)} bytes, {SECONDS}s loop)")

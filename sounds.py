"""Synthesizes every sound in the video (sound effects + music) with plain math (NumPy).
No audio files, no samples, no licensing issues.
Input: the event list returned by audioEvents() in the scene file."""
import wave
import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def tt(d):
    return np.arange(int(d * SR)) / SR


def decay(n, k):
    return np.exp(-np.arange(n) / SR * k)


def lowpass(x, k=8):
    if k <= 1:
        return x
    return np.convolve(x, np.ones(k) / k, mode="same")


def key(v=0.5):
    n = int(0.04 * SR)
    noise = np.diff(rng.normal(0, 1, n + 1)) * decay(n, 140)
    click = np.sin(2 * np.pi * (1800 + rng.uniform(-300, 300)) * tt(0.04)[:n]) * decay(n, 260)
    return (noise * 0.18 + click * 0.25) * v


def rkey(v=0.3):
    n = int(0.02 * SR)
    return np.sin(2 * np.pi * 3200 * tt(0.02)[:n]) * decay(n, 300) * 0.25 * v


def tick(f=1200):
    t = tt(0.035)
    return np.sin(2 * np.pi * f * t) * decay(len(t), 110) * 0.22


def ding(f=1568):
    t = tt(0.9)
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.01 * t) + 0.2 * np.sin(2 * np.pi * f * 3 * t)
    return x * decay(len(t), 5.5) * 0.28


def whoosh(v=1.0):
    t = tt(0.5)
    x = lowpass(rng.normal(0, 1, len(t)), 6) * np.sin(np.pi * t / 0.5) ** 2
    return x * 0.35 * v


def swish(v=0.5):
    t = tt(0.22)
    x = lowpass(rng.normal(0, 1, len(t)), 3) * np.sin(np.pi * t / 0.22) ** 2
    return x * 0.25 * v


def gasp():
    t = tt(0.35)
    f = 520 + 380 * (t / 0.35)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.35)
    return x * 0.22


def boom():
    t = tt(1.4)
    f = 95 * np.exp(-t * 2.2) + 32
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(len(t), 3.2)
    crack = lowpass(rng.normal(0, 1, len(t)), 12) * decay(len(t), 9)
    return np.tanh((body * 1.1 + crack * 0.9) * 1.6) * 0.75


def fwoosh(v=1.0):
    t = tt(0.7)
    x = lowpass(rng.normal(0, 1, len(t)), 20) * np.minimum(1, t / 0.12) * np.exp(-t * 3)
    return x * 1.6 * v


def crackle(d=1.5, v=1.0):
    n = int(d * SR)
    x = lowpass(rng.normal(0, 1, n), 30) * 0.5
    for _ in range(int(d * 40)):
        p = rng.integers(0, n - 300)
        x[p:p + 300] += rng.normal(0, 1, 300) * decay(300, 900) * rng.uniform(0.3, 1)
    env = np.minimum(1, np.arange(n) / (0.2 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.4 * SR))
    return x * env * 0.35 * v


def poof():
    t = tt(0.5)
    return lowpass(rng.normal(0, 1, len(t)), 40) * decay(len(t), 7) * 1.3


def thud():
    t = tt(0.4)
    f = 110 * np.exp(-t * 8) + 45
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(len(t), 10)
    return np.tanh(x * 2) * 0.7 + lowpass(rng.normal(0, 1, len(t)), 20) * decay(len(t), 25) * 0.6


def beep2():
    out = []
    for f in (880, 587):
        t = tt(0.13)
        out.append(np.sign(np.sin(2 * np.pi * f * t)) * 0.08 * np.minimum(1, (len(t) - np.arange(len(t))) / 600))
        out.append(np.zeros(int(0.04 * SR)))
    return np.concatenate(out)


def pop(f=500):
    t = tt(0.12)
    fr = f * (1 + 1.5 * t / 0.12)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * decay(len(t), 30) * 0.4


def alarm():
    out = []
    for _ in range(3):
        t = tt(0.07)
        out.append(np.sign(np.sin(2 * np.pi * 1300 * t)) * 0.07)
        out.append(np.zeros(int(0.05 * SR)))
    return np.concatenate(out)


def sting():
    """synthetic 'sad trombone': four descending notes."""
    out = []
    notes = [(392, 0.32), (370, 0.32), (349, 0.32), (330, 1.1)]
    for f, d in notes:
        t = tt(d)
        vib = 1 + 0.012 * np.sin(2 * np.pi * 6 * t) * (d > 1)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        x = sum(np.sin(k * ph) / k for k in range(1, 8))
        env = np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.08)
        out.append(lowpass(x, 4) * env * 0.16)
    return np.concatenate(out)



def click(v=1.0):
    n = int(0.03 * SR)
    x = np.diff(rng.normal(0, 1, n + 1)) * decay(n, 250) * 0.35 + np.sin(2 * np.pi * 2500 * tt(0.03)[:n]) * decay(n, 300) * 0.3
    return x * v


def buzz(n=2, v=1.0):
    """error 'eh-eh': short low buzz."""
    out = []
    for _ in range(n):
        t = tt(0.19)
        x = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.2 + np.sign(np.sin(2 * np.pi * 226 * t)) * 0.1
        env = np.minimum(1, t / 0.01) * np.minimum(1, (0.19 - t) / 0.02)
        out.append(lowpass(x, 3) * env)
        out.append(np.zeros(int(0.04 * SR)))
    return np.concatenate(out) * v


def drumroll(d=1.0, v=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    step = int(0.035 * SR)
    for p in range(0, n - 700, step):
        x[p:p + 600] += np.diff(rng.normal(0, 1, 601)) * decay(600, 110) * rng.uniform(0.6, 1)
    return lowpass(x, 4) * np.linspace(0.35, 1.0, n) * 0.4 * v


def tada(v=1.0):
    out = []
    for f, d in [(523.25, 0.11), (659.25, 0.11), (783.99, 0.11), (1046.5, 0.7)]:
        t = tt(d)
        ph = 2 * np.pi * f * t
        x = sum(np.sin(k * ph) / k ** 1.3 for k in range(1, 7))
        env = np.minimum(1, t / 0.015) * np.minimum(1, (d - t) / 0.06) * (decay(len(t), 2.5) if d > 0.5 else 1)
        out.append(lowpass(x, 3) * env * 0.13)
    return np.concatenate(out) * v


def sparkle(v=1.0):
    out = np.zeros(int(0.9 * SR))
    for _ in range(16):
        f = rng.uniform(2200, 4400)
        p = int(rng.uniform(0, 0.7) * SR)
        t = tt(0.12)
        s = np.sin(2 * np.pi * f * t) * decay(len(t), 30) * 0.07
        out[p:p + len(s)] += s[: len(out) - p]
    return out * v


def cricket(d=1.2, v=1.0):
    """crickets: the awkward silence."""
    n = int(d * SR)
    x = np.zeros(n)
    for start in np.arange(0, d - 0.25, 0.5):
        for k in range(3):
            p = int((start + k * 0.06) * SR)
            t = tt(0.035)
            s = np.sin(2 * np.pi * 4300 * t) * np.sin(np.pi * t / 0.035) * 0.12
            x[p:p + len(s)] += s[: n - p]
    return x * v

SFX = dict(key=key, rkey=rkey, tick=tick, ding=ding, whoosh=whoosh, swish=swish, gasp=gasp, boom=boom,
           fwoosh=fwoosh, crackle=crackle, poof=poof, thud=thud, beep2=beep2, pop=pop, alarm=alarm, sting=sting,
           click=click, buzz=buzz, drumroll=drumroll, tada=tada, sparkle=sparkle, cricket=cricket)


def music(dur, bpm, mute, end):
    n = int(dur * SR)
    out = np.zeros(n)
    beat = 60 / bpm
    bass_notes = [110, 110, 130.8, 110, 98, 98, 82.4, 98]  # A minor, eighth notes
    i = 0
    tb = 0.0
    while tb < end:
        p = int(tb * SR)
        # kick drum on every beat
        if i % 2 == 0:
            t = tt(0.18)
            f = 120 * np.exp(-t * 25) + 45
            k = np.sin(2 * np.pi * np.cumsum(f) / SR) * decay(len(t), 18) * 0.5
            out[p:p + len(k)] += k[: n - p]
        else:  # hi-hat on the off-beat
            h = np.diff(rng.normal(0, 1, int(0.03 * SR) + 1)) * decay(int(0.03 * SR), 160) * 0.05
            out[p:p + len(h)] += h[: n - p]
        # bass
        f = bass_notes[i % 8]
        t = tt(beat / 2)
        ph = 2 * np.pi * f * t
        b = (np.sin(ph) + np.sin(3 * ph) / 3 + np.sin(5 * ph) / 6) * decay(len(t), 5) * 0.13
        out[p:p + len(b)] += b[: n - p]
        i += 1
        tb += beat / 2
    # dramatic silence at the impact moments
    gain = np.ones(n)
    fade = int(0.03 * SR)
    for a, b in mute:
        ia, ib = int(a * SR), int(b * SR)
        gain[ia:ib] = 0
        gain[max(0, ia - fade):ia] = np.minimum(gain[max(0, ia - fade):ia], np.linspace(1, 0, ia - max(0, ia - fade)))
        gain[ib:ib + fade] = np.minimum(gain[ib:ib + fade], np.linspace(0, 1, len(gain[ib:ib + fade])))
    return out * gain


def build(spec, path):
    dur = spec["dur"] + 0.5
    n = int(dur * SR)
    mix = music(dur, spec["music"]["bpm"], spec["music"]["mute"], spec["music"]["end"]) * 0.8
    for ev in spec["events"]:
        params = {k: v for k, v in ev.items() if k not in ("t", "type")}
        x = SFX[ev["type"]](**params)
        p = int(ev["t"] * SR)
        mix[p:p + len(x)] += x[: n - p]
    mix = np.tanh(mix * 1.1)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
    data = (mix * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())

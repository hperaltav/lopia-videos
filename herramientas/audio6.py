import numpy as np, wave
SR = 48000; DUR = 52.2; N = int(SR * DUR)
out = np.zeros(N)
rng = np.random.default_rng(7)
def add(sig, t, gain=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i < N: out[i:j] += sig[:j - i] * gain
def tt(d): return np.arange(int(d * SR)) / SR
def env(d, a=0.005, r=0.3):
    x = tt(d); e = np.minimum(1, x / a) * np.exp(-x / r); return e
def pluck(f, d=0.6, r=0.25):
    x = tt(d); return (np.sin(2*np.pi*f*x) + 0.35*np.sin(2*np.pi*2*f*x) + 0.12*np.sin(2*np.pi*3.01*f*x)) * env(d, 0.003, r)
def noise(d): return rng.standard_normal(int(d * SR))



bpm = 104; beat = 60 / bpm
notes = {'C4':261.63,'D4':293.66,'E4':329.63,'G4':392.0,'A4':440.0,'C5':523.25,'D5':587.33,'E5':659.25,'G5':783.99}
bass = {'C':65.41,'A':55.0,'F':87.31,'G':98.0}
prog = ['C','G','A','F']
melody = ['G4','C5','E5','D5','C5','E5','G5','E5','A4','C5','E5','D5','C5','A4','G4','D5']
for b in range(int(47.46 / beat)):
    t = b * beat; ch = prog[(b // 8) % 4]
    x = tt(beat * 0.95); add(np.sin(2*np.pi*bass[ch]*x) * env(beat*0.95, 0.01, 0.35), t, 0.3)
    for k in range(2):
        idx = (b*2 + k) % len(melody)
        if (b*2 + k) % 5 == 3: continue
        add(pluck(notes[melody[idx]], 0.5, 0.18), t + k*beat/2, 0.14 if k == 0 else 0.1)
    hh = noise(0.05) * env(0.05, 0.001, 0.012); hh = np.diff(np.concatenate([[0], hh])); add(hh, t + beat/2, 0.05)
    if b % 2 == 0:
        x = tt(0.25); add(np.sin(2*np.pi*(50 + 90*np.exp(-x*30))*x) * np.exp(-x*12), t, 0.32)

# efectos
def whoosh(d=0.7, g=0.25):
    n = noise(d); x = tt(d)
    # filtro pasa-banda que sube
    from numpy.fft import rfft, irfft
    s = np.zeros_like(n); win = int(0.05*SR)
    for i in range(0, len(n) - win, win):
        seg = n[i:i+win]; F = rfft(seg); fr = np.fft.rfftfreq(win, 1/SR)
        c = 300 + 3000 * (i/len(n)); F *= np.exp(-((fr - c)/ (c*0.6))**2); s[i:i+win] = irfft(F, win)
    return s * np.sin(np.pi * x / d) * g * 6
def pop(f=600): x = tt(0.12); return np.sin(2*np.pi*(f + 900*np.exp(-x*40))*x) * np.exp(-x*35)
def ding(f=1318.5, d=1.2): x = tt(d); return (np.sin(2*np.pi*f*x) + 0.4*np.sin(2*np.pi*2.76*f*x)) * env(d, 0.002, 0.35)
def zap(d=0.6):
    x = tt(d); f = 900 + 500*np.sin(2*np.pi*7*x); ph = 2*np.pi*np.cumsum(f)/SR
    return (np.sin(ph) * 0.6 + noise(d)*0.15) * np.sin(np.pi*x/d)**0.5 * np.exp(-x*2.5)
def drill(d):
    x = tt(d); ph = 2*np.pi*np.cumsum(2400 + 120*np.sin(2*np.pi*31*x))/SR
    return (np.sin(ph) + 0.3*np.sin(2*ph)) * np.minimum(1, x/0.1) * np.minimum(1, (d - x)/0.15) * (0.7 + 0.3*np.sin(2*np.pi*9*x))
def boing():
    x = tt(0.5); return np.sin(2*np.pi*(180 + 120*np.sin(2*np.pi*14*x)*np.exp(-x*5))*x) * np.exp(-x*6)


def ching():
    x = tt(1.6); s = np.zeros_like(x)
    for f, a, d in [(2637, 1.0, 0.55), (2637*2.76, 0.5, 0.3), (2637*5.4, 0.25, 0.18), (3951, 0.6, 0.45)]:
        s += a*np.sin(2*np.pi*f*x) * np.exp(-x/d)
    s *= (1 + 0.15*np.sin(2*np.pi*9*x)); s[:int(0.003*SR)] *= np.linspace(0, 1, int(0.003*SR))
    return s / np.max(np.abs(s))
def tok(): x = tt(0.15); return np.sin(2*np.pi*(320 + 400*np.exp(-x*60))*x) * np.exp(-x*40)
def scrape(d):
    n = noise(d); x = tt(d); return n * (0.5 + 0.5*np.sin(2*np.pi*14*x))**2 * np.minimum(1, x/0.05) * np.minimum(1, (d-x)/0.1)

MAP = [[0, 0], [10.304, 2.45], [10.454, 2.6], [14.791, 6.91], [15.01, 7.1], [16.907, 8.97], [17.122, 9.24], [20.594, 12.75], [20.768, 12.96], [24.513, 16.96], [24.738, 17.22], [28.678, 21.5], [28.867, 21.67], [36.68, 30.21], [36.891, 30.41], [41.549, 35.12], [41.745, 35.37], [45.876, 40.16], [46.1, 40.44], [49.871, 44.22]]
def inv(T):
    if T >= MAP[-1][1]: return MAP[-1][0] + T - MAP[-1][1]
    for (a0,b0),(a1,b1) in zip(MAP, MAP[1:]):
        if T <= b1: return a0 + (a1-a0)*(T-b0)/(b1-b0)
def addo(sig, T, g=1.0): add(sig, inv(T), g)
add(whoosh(0.6), 0.0, 0.3)
add(pop(500), 0.1, 0.3)
for i in range(4): add(boing()*0.4, 0.6 + i*0.38, 0.12)   # Verónica niega
for i in range(8): add(pop(650 + 60*i), 2.55 + i*0.15, 0.16)            # ola: cada diente lleva el suyo
for i, t in enumerate((4.26, 6.6, 8.42)): add(whoosh(0.35), t - 0.15, 0.2); add(ding(1046.5*(1 + 0.12*i), 0.8), t + 0.05, 0.13)
add(whoosh(0.5), 10.3, 0.4)
addo(whoosh(0.6), 3.0, 0.3); addo(tok(), 4.55, 0.45)
x = tt(1.2); addo(np.sin(2*np.pi*(420 + 30*np.sin(2*np.pi*6*x))*x) * env(1.2, 0.15, 0.6), 4.9, 0.06)   # luz azul
addo(boing(), 7.5, 0.25); addo(boing(), 8.1, 0.18)
addo(ding(1318.5, 0.9), 12.42, 0.14)
addo(scrape(3.0)*0.35, 13.2, 0.05); addo(ding(1567.98, 0.9), 16.44, 0.14)
for i in range(4): addo(pop(900 + 80*i), 17.6 + i*0.45, 0.2)
addo(ding(1760, 0.9), 20.79, 0.12)
addo(boing(), 22.0, 0.3); addo(whoosh(0.4), 22.9, 0.25); addo(pop(400), 23.9, 0.4)
for i in range(7): addo(pop(650 + 60*i), 26.8 + i*0.12, 0.15)
addo(whoosh(0.5), 27.4, 0.3); addo(ding(1318.5, 1.0), 28.08, 0.12)
for i in range(5): addo(pluck(1046.5*(1+0.06*i), 0.3, 0.1), 28.4 + i*0.35, 0.05)
addo(whoosh(0.6), 30.2, 0.35); addo(tok(), 33.17 - 0.25, 0.35); addo(ding(1567.98, 1.0), 33.17, 0.12)
addo(whoosh(0.6), 35.2, 0.35)
for i in range(8): addo(pop(600 + 50*i), 37.9 + i*0.12, 0.15)
addo(scrape(0.8)*0.4, 38.9, 0.05)
addo(whoosh(0.4), 40.25, 0.35); addo(ching(), 40.55, 0.28)
addo(whoosh(0.6), 41.7, 0.35)
for i, f in enumerate((523.25, 659.25, 783.99, 1046.5)): addo(pluck(f, 2.5, 0.9), 42.2 + i*0.09, 0.22)
addo(ding(1046.5, 2.0), 42.6, 0.16); addo(pop(500), 43.3, 0.3)
fade = np.ones(N); k = int(2.0*SR); fade[-k:] = np.linspace(1, 0, k); out *= fade
out = np.tanh(out * 1.2); out /= np.max(np.abs(out)) / 0.85
st = np.stack([out, out], 1)
with wave.open('/home/claude/v3/music4.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
print('ok')

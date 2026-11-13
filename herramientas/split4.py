import subprocess, re, numpy as np, json
LINES = ["Los brackets no son todos iguales.",
"Cada diente lleva el suyo: los incisivos usan uno más ancho, los caninos traen un ganchito y las muelas llevan otra pieza.",
"Todo parte con el bracket: una pieza pequeña que se pega sobre cada diente.",
"Pero solo el bracket no hace nada.",
"Cada uno tiene una ranura al centro: ese es el slot.",
"Por ahí pasa un alambre que mueve los dientes: ese es el arco.",
"En cada esquina del bracket hay unos ganchitos: esas son las aletas.",
"Pero el arco se sale; para sujetarlo, se enganchan unos elásticos en las aletas: esas son las ligas, y las hay de muchos colores.",
"Y en las muelas, el arco se ancla en un pequeño tubo: ese es el tubo molar.",
"Se pueden instalar en una sola sesión, aunque esto depende de cada caso.",
"¿Quieres mejorar tu sonrisa? Agenda tu evaluación en PazDentium."]
dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0','voz4.mp3'],capture_output=True,text=True).stdout)
o = subprocess.run(['ffmpeg','-i','voz4.mp3','-af','silencedetect=n=-40dB:d=0.1','-f','null','-'],capture_output=True,text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', o)]; en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', o)]
if len(en) < len(st): en.append(dur)
sil = list(zip(st, en))
s0 = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
e_end = sil[-1][0] if sil and sil[-1][1] >= dur - 0.05 else dur
cands = [(a, b) for a, b in sil if a > s0 + 0.3 and b < e_end - 0.3]
print('dur', round(dur,2), 'speech', round(s0,2), round(e_end,2), 'silences', len(cands))
# peso esperado: sílabas aprox (vocales) + pausas por coma
w = np.array([len(re.findall(r'[aeiouáéíóú]', l.lower())) + 3*l.count(',') + 3*l.count(':') + 3*l.count(';') for l in LINES], float)
K = len(LINES) - 1
pts = [s0] + [None]*0
# DP sobre cortes: estado = índice del último corte elegido
starts = [s0] + [b for a, b in cands]; ends = [a for a, b in cands] + [e_end]
n = len(cands)
INF = 1e18
total = (e_end - s0); q = w / w.sum()
# dp[j][i] = mejor costo usando j cortes, el último es el candidato i (i=-1 → inicio)
dp = np.full((K + 1, n + 1), INF); bk = np.full((K + 1, n + 1), -1, int)
# índice 0 = inicio virtual
dp[0][0] = 0
def segcost(line, a, b):
    d = b - a
    if d <= 0.2: return INF
    return np.log((d/total) / q[line])**2
for j in range(1, K + 1):
    for i in range(1, n + 1):            # candidato i-1 como j-ésimo corte
        a_end = cands[i-1][0]
        best = INF
        for p in range(0, i):
            if dp[j-1][p] >= INF: continue
            a_st = s0 if p == 0 else cands[p-1][1]
            c = dp[j-1][p] + segcost(j-1, a_st, a_end) - 0.8*(cands[i-1][1]-cands[i-1][0])
            if c < best: best, bk[j][i] = c, p
        dp[j][i] = best
best, bi = INF, -1
for i in range(1, n + 1):
    if dp[K][i] >= INF: continue
    c = dp[K][i] + segcost(K, cands[i-1][1], e_end)
    if c < best: best, bi = c, i
cuts = []; j, i = K, bi
while j > 0: cuts.append(cands[i-1]); i = bk[j][i]; j -= 1
cuts = cuts[::-1]
bounds = []; prev = s0
for a, b in cuts: bounds.append((prev, a)); prev = b
bounds.append((prev, e_end))
for l, (a, b) in zip(LINES, bounds): print(f'{a:6.2f}-{b:6.2f} ({b-a:4.2f}) {l[:60]}')
json.dump({'lines': LINES, 'bounds': bounds, 'dur': dur}, open('timing4.json', 'w'), ensure_ascii=False)

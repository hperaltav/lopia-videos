"""
Clonación de voz por conversión (estilo RVC simplificado) — ejemplo didáctico en PyTorch.

Idea: "cualquier voz → una voz objetivo".
  1. Contenido: HuBERT (transformer ya entrenado, congelado) convierte el audio en "qué se dice", sin "quién lo dice".
  2. Tono: se extrae la frecuencia fundamental (F0) aparte, para conservar la entonación.
  3. Recuperación: las características de HuBERT se mezclan con las más parecidas de la voz objetivo (índice kNN).
  4. Decodificador (lo único que se entrena): contenido + tono → espectrograma mel con el timbre de la voz objetivo.
  5. Vocoder: mel → onda de audio. Aquí Griffin-Lim (simple, suena metálico); en producción se usa un vocoder
     neuronal ya entrenado (HiFi-GAN, BigVGAN), que es la mayor diferencia de calidad.

Entrenamiento: solo con grabaciones de la persona objetivo (10–30 min, voz limpia, una sola persona).
El modelo aprende a reconstruir su propio mel a partir de contenido + tono. Al convertir, el contenido viene de otra
voz (por ejemplo, un TTS), y el decodificador lo "pronuncia" con el timbre aprendido.

Uso responsable: entrena solo con voces de personas que dieron su consentimiento explícito y por escrito.

Requisitos:  pip install torch torchaudio soundfile
Uso:
  python clonacion_voz_demo.py entrenar --datos carpeta_wav/ --salida modelo.pt
  python clonacion_voz_demo.py convertir --modelo modelo.pt --entrada tts.wav --salida voz_clonada.wav --tono 0
"""
import argparse, glob, math, os
import torch, torch.nn as nn, torch.nn.functional as F
import torchaudio
import soundfile as sf               # lectura/escritura de WAV (torchaudio.load/save ahora dependen de torchcodec)

SR = 16000                      # HuBERT trabaja a 16 kHz
HOP = 320                       # HuBERT entrega 1 vector cada 20 ms (320 muestras)
N_MELS = 80
DEV = 'cuda' if torch.cuda.is_available() else 'cpu'

# ------------------------------------------------------------------ 1) extractores (congelados)
class Extractores:
    def __init__(self):
        b = torchaudio.pipelines.HUBERT_BASE                      # transformer auto-supervisado (12 capas, 768 dims)
        self.hubert = b.get_model().to(DEV).eval()
        self.mel = torchaudio.transforms.MelSpectrogram(SR, n_fft=1024, win_length=1024, hop_length=HOP, n_mels=N_MELS).to(DEV)

    @torch.no_grad()
    def contenido(self, wav):                                     # wav: (1, T) → (frames, 768)
        feats, _ = self.hubert.extract_features(wav.to(DEV))
        return feats[9][0]                                        # capa intermedia: más "fonética", menos "hablante"

    @torch.no_grad()
    def tono(self, wav, n):                                       # F0 en Hz por frame (0 = sin voz)
        f0 = torchaudio.functional.detect_pitch_frequency(wav.to(DEV), SR, frame_time=HOP/SR, freq_low=60, freq_high=600)[0]
        f0 = F.interpolate(f0[None, None], size=n, mode='nearest')[0, 0]
        energia = self.mel(wav.to(DEV))[0].mean(0)
        energia = F.interpolate(energia[None, None], size=n, mode='nearest')[0, 0]
        return torch.where(energia > energia.median()*0.3, f0, torch.zeros_like(f0))

    @torch.no_grad()
    def mel_log(self, wav, n):
        m = torch.log(self.mel(wav.to(DEV))[0].clamp(min=1e-5))   # (80, frames)
        return F.interpolate(m[None], size=n, mode='linear')[0].T  # (n, 80)

def cargar(path):
    data, sr = sf.read(path, dtype='float32', always_2d=True)
    wav = torch.from_numpy(data.T).mean(0, keepdim=True)
    return torchaudio.functional.resample(wav, sr, SR) if sr != SR else wav

# ------------------------------------------------------------------ 2) el modelo que se entrena
class TonoEmb(nn.Module):                                         # F0 continuo → embedding (escala logarítmica, 256 bandas)
    def __init__(self, d):
        super().__init__(); self.emb = nn.Embedding(257, d)
    def forward(self, f0):
        b = torch.where(f0 > 0, ((torch.log2(f0.clamp(min=50)/50)/math.log2(1100/50))*255).round().clamp(0, 255) + 1, torch.zeros_like(f0))
        return self.emb(b.long())

class Decodificador(nn.Module):
    """contenido (768) + tono → mel (80). Convoluciones locales + transformer para contexto + post-red residual."""
    def __init__(self, d=256, capas=4):
        super().__init__()
        self.entrada = nn.Linear(768, d); self.tono = TonoEmb(d)
        self.conv = nn.Sequential(nn.Conv1d(d, d, 5, padding=2), nn.GELU(), nn.Conv1d(d, d, 5, padding=2), nn.GELU())
        capa = nn.TransformerEncoderLayer(d, nhead=4, dim_feedforward=4*d, dropout=0.1, batch_first=True, norm_first=True)
        self.transformer = nn.TransformerEncoder(capa, capas, enable_nested_tensor=False)
        self.salida = nn.Linear(d, N_MELS)
        self.post = nn.Sequential(nn.Conv1d(N_MELS, 256, 5, padding=2), nn.Tanh(), nn.Conv1d(256, N_MELS, 5, padding=2))

    def forward(self, cont, f0):                                  # (B, n, 768), (B, n)
        x = self.entrada(cont) + self.tono(f0)
        x = x + self.conv(x.transpose(1, 2)).transpose(1, 2)
        x = self.transformer(x)
        m = self.salida(x)
        return m + self.post(m.transpose(1, 2)).transpose(1, 2)  # mel "grueso" + corrección fina

# ------------------------------------------------------------------ 3) recuperación (la "R" de RVC)
def recuperar(cont, banco, k=8, ratio=0.6):
    """Reemplaza parcialmente cada vector de contenido por el promedio de sus k vecinos más cercanos en el banco de la voz
    objetivo. Acerca la pronunciación a la de la persona y reduce que se 'filtre' el timbre de la voz de entrada."""
    sims = F.normalize(cont, dim=-1) @ F.normalize(banco, dim=-1).T          # similitud coseno (n, N)
    w, idx = sims.topk(k, dim=-1); w = torch.softmax(w*20, dim=-1)
    vecinos = (banco[idx]*w[..., None]).sum(1)
    return ratio*vecinos + (1 - ratio)*cont

# ------------------------------------------------------------------ entrenamiento
def entrenar(datos, salida, epocas=200, seg=200):
    ex = Extractores(); items = []
    for p in sorted(glob.glob(os.path.join(datos, '*.wav'))):              # precálculo: contenido, tono y mel de cada archivo
        wav = cargar(p); c = ex.contenido(wav); n = c.shape[0]
        items.append((c.cpu(), ex.tono(wav, n).cpu(), ex.mel_log(wav, n).cpu())); print('ok', os.path.basename(p), n, 'frames')
    banco = torch.cat([c for c, _, _ in items])                              # banco para la recuperación
    banco = banco[torch.randperm(len(banco))[:20000]]
    mu, sd = torch.cat([m for _, _, m in items]).mean(0), torch.cat([m for _, _, m in items]).std(0) + 1e-5
    modelo = Decodificador().to(DEV)
    opt = torch.optim.AdamW(modelo.parameters(), lr=2e-4, weight_decay=0.01)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, epocas)
    for ep in range(epocas):
        perm, total = torch.randperm(len(items)), 0.0
        for i in range(0, len(items), 8):                                     # lotes de 8 recortes de 4 s
            lote = [items[j] for j in perm[i:i + 8]]; cs, fs, ms = [], [], []
            for c, f, m in lote:
                a = torch.randint(0, max(1, c.shape[0] - seg), (1,)).item()
                cs.append(F.pad(c[a:a + seg], (0, 0, 0, seg - c[a:a + seg].shape[0])))
                fs.append(F.pad(f[a:a + seg], (0, seg - f[a:a + seg].shape[0])))
                ms.append(F.pad((m[a:a + seg] - mu)/sd, (0, 0, 0, seg - m[a:a + seg].shape[0])))
            c, f, m = torch.stack(cs).to(DEV), torch.stack(fs).to(DEV), torch.stack(ms).to(DEV)
            c = c + 0.1*torch.randn_like(c)                                   # ruido: el modelo no debe depender de detalles del hablante
            pred = modelo(c, f*torch.empty(len(f), 1, device=DEV).uniform_(0.9, 1.1))   # leve variación de tono (robustez)
            loss = F.l1_loss(pred, m)
            opt.zero_grad(); loss.backward(); nn.utils.clip_grad_norm_(modelo.parameters(), 1.0); opt.step(); total += loss.item()
        sched.step()
        if ep % 10 == 0: print(f'época {ep}  pérdida {total/math.ceil(len(items)/8):.4f}')
    f0s = torch.cat([f for _, f, _ in items]); f0_med = f0s[f0s > 0].median().item()
    torch.save({'modelo': modelo.state_dict(), 'banco': banco, 'mu': mu, 'sd': sd, 'f0_med': f0_med}, salida)
    print('guardado en', salida)

# ------------------------------------------------------------------ conversión
@torch.no_grad()
def convertir(ruta_modelo, entrada, salida, semitonos=None, ratio=0.6):
    ck = torch.load(ruta_modelo, map_location=DEV); ex = Extractores()
    modelo = Decodificador().to(DEV); modelo.load_state_dict(ck['modelo']); modelo.eval()
    wav = cargar(entrada); c = ex.contenido(wav); f0 = ex.tono(wav, c.shape[0])
    if semitonos is None:                                                     # lleva el tono al rango de la voz objetivo
        med = f0[f0 > 0].median().item() if (f0 > 0).any() else ck['f0_med']; semitonos = 12*math.log2(ck['f0_med']/med)
    f0 = f0*(2**(semitonos/12))
    c = recuperar(c, ck['banco'].to(DEV), ratio=ratio)
    mel = modelo(c[None], f0[None])[0]*ck['sd'].to(DEV) + ck['mu'].to(DEV)  # (n, 80) en escala log
    # vocoder simple (Griffin-Lim). Para calidad real: reemplazar por HiFi-GAN/BigVGAN pre-entrenado con los mismos parámetros mel.
    inv = torchaudio.transforms.InverseMelScale(n_stft=513, n_mels=N_MELS, sample_rate=SR).to(DEV)
    gl = torchaudio.transforms.GriffinLim(n_fft=1024, win_length=1024, hop_length=HOP, n_iter=64).to(DEV)
    audio = gl(inv(mel.T.exp()))
    sf.write(salida, (audio/audio.abs().max()*0.9).cpu().numpy(), SR)
    print(f'listo: {salida} (tono ajustado {semitonos:+.1f} semitonos)')

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('entrenar'); a.add_argument('--datos', required=True); a.add_argument('--salida', default='modelo.pt'); a.add_argument('--epocas', type=int, default=200)
    b = sub.add_parser('convertir'); b.add_argument('--modelo', required=True); b.add_argument('--entrada', required=True); b.add_argument('--salida', default='salida.wav')
    b.add_argument('--tono', type=float, default=None, help='semitonos; vacío = automático'); b.add_argument('--ratio', type=float, default=0.6)
    args = ap.parse_args()
    if args.cmd == 'entrenar': entrenar(args.datos, args.salida, args.epocas)
    else: convertir(args.modelo, args.entrada, args.salida, args.tono, args.ratio)

#!/usr/bin/env python3
"""Compõe a trilha da v2 (eletrônica inspiradora, 120 BPM) sobre a grade do config.ts.

Estrutura (tempos vindos de scripts/marcas.mjs):
  intro pulsante (Cenas 1-2) > groove (Cena 3, abafa na falha e quase some no "Resultado?")
  > build com caixa acelerando (Cena 4) > corte seco + 0,3 s de silêncio > tensão quase vazia
  > DROP na reconexão (0:45) > rede (Cena 6, pico) > jornada (Cena 7, mais leve)
  > "Agora é fazer chegar": acorde final grande > silêncio sob a cartela final.

Uso: python3 scripts/compor-trilha.py  (gera assets/trilha.wav)
"""
import json, subprocess, sys, os
import numpy as np
from scipy.signal import butter, lfilter, lfilter_zi

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = json.loads(subprocess.run(['node', os.path.join(RAIZ, 'scripts/marcas.mjs')], capture_output=True, text=True, check=True).stdout)
SR = 44100
DUR = M['fim']
N = int(DUR * SR)
BAT = 60 / M['bpm']
O = M['origem']
DROP, CORTE, SIL, CHEGAR = M['drop'], M['corteRiser'], M['silencio'], M['chegar']
FALHA, RESULT = M['falha'], M['resultado']
C = M['cenas']
rng = np.random.default_rng(7)


def hz(n):  # 'B1', 'F#4'
    nomes = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    s = nomes[n[0]] + (1 if '#' in n else -1 if n[1] == 'b' else 0)
    o = int(n[-1])
    return 440 * 2 ** (((o + 1) * 12 + s - 69) / 12)


ACORDES = [  # vi - IV - I - V em Ré maior
    {'baixo': 'B1', 'pad': ['B3', 'D4', 'F#4'], 'arp': ['B4', 'D5', 'F#5', 'B5']},
    {'baixo': 'G1', 'pad': ['G3', 'B3', 'D4'], 'arp': ['G4', 'B4', 'D5', 'G5']},
    {'baixo': 'D2', 'pad': ['D4', 'F#4', 'A4'], 'arp': ['D5', 'F#5', 'A5', 'D6']},
    {'baixo': 'A1', 'pad': ['A3', 'C#4', 'E4'], 'arp': ['A4', 'C#5', 'E5', 'A5']},
]
acorde = lambda t: ACORDES[int(np.floor((t - O) / (4 * BAT))) % 4]

trilhas = {k: np.zeros(N) for k in ['bateria', 'baixo', 'pad', 'arp', 'stab', 'fx']}


def por(nome, t0, sinal):
    i = int(round(t0 * SR))
    if i >= N or i + len(sinal) <= 0:
        return
    if i < 0:
        sinal, i = sinal[-i:], 0
    j = min(N, i + len(sinal))
    trilhas[nome][i:j] += sinal[: j - i]


def tt(d):
    return np.arange(int(d * SR)) / SR


def saw(f, d, detune=0.0):
    t = tt(d)
    return 2 * ((t * f * (1 + detune)) % 1) - 1


def lp(x, fc, ordem=2):
    b, a = butter(ordem, min(fc, SR / 2 - 100) / (SR / 2))
    return lfilter(b, a, x)


def hp(x, fc):
    b, a = butter(2, fc / (SR / 2), 'high')
    return lfilter(b, a, x)


# ---------------- instrumentos ----------------
def kick(t0, amp=1.0):
    t = tt(0.4)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7) + 0.25 * np.exp(-t * 300) * rng.standard_normal(len(t))
    por('bateria', t0, amp * 0.9 * s)


def clap(t0, amp=1.0):
    t = tt(0.25)
    ruido = rng.standard_normal(len(t))
    env = np.exp(-t * 22) + 0.6 * np.exp(-((t - 0.012) % 0.011) * 400) * (t < 0.035)
    s = hp(lp(ruido, 3500), 900) * env
    por('bateria', t0, amp * 0.45 * s)


def hat(t0, amp=1.0, aberto=False):
    t = tt(0.25 if aberto else 0.06)
    s = hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (14 if aberto else 70))
    por('bateria', t0, amp * 0.22 * s)


def caixa(t0, amp=1.0):
    t = tt(0.18)
    s = (hp(lp(rng.standard_normal(len(t)), 6000), 1200) * 0.8 + 0.5 * np.sin(2 * np.pi * 190 * t)) * np.exp(-t * 26)
    por('bateria', t0, amp * 0.4 * s)


def baixo(t0, nota, d, amp=1.0, fc=700):
    f = hz(nota)
    s = 0.6 * saw(f, d) + 0.6 * saw(f, d, 0.004) + 0.8 * np.sin(2 * np.pi * f / 2 * tt(d))
    env = np.minimum(1, tt(d) / 0.008) * np.exp(-tt(d) * 3.5)
    por('baixo', t0, amp * 0.32 * lp(s * env, fc))


def pad(t0, notas, d, amp=1.0, fc=1400, ataque=0.6, rel=0.8):
    t = tt(d + rel)
    s = np.zeros(len(t))
    for n in notas:
        for dt in (-0.006, 0.0, 0.007):
            s += saw(hz(n), d + rel, dt)
    env = np.minimum(1, t / ataque) * np.where(t > d, np.exp(-(t - d) / (rel / 3)), 1)
    por('pad', t0, amp * 0.06 * lp(s * env, fc))


def pluck(t0, nota, amp=1.0, fc=3000, dec=9):
    t = tt(0.4)
    f = hz(nota)
    s = 0.7 * saw(f, 0.4) + 0.5 * np.sign(np.sin(2 * np.pi * f * t))
    por('arp', t0, amp * 0.11 * lp(s * np.exp(-t * dec), fc))


def stab(t0, notas, amp=1.0, d=0.35):
    t = tt(d)
    s = np.zeros(len(t))
    for n in notas:
        for dt in (-0.012, -0.004, 0.004, 0.012):
            s += saw(hz(n) * 2, d, dt)
    por('stab', t0, amp * 0.035 * lp(s * np.exp(-t * 7), 5200))


def impacto(t0, amp=1.0):
    t = tt(2.5)
    f = 30 + 40 * np.exp(-t * 3)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    s += 0.6 * lp(rng.standard_normal(len(t)), 1200) * np.exp(-t * 4)
    por('fx', t0, amp * 0.8 * s)


def subida(t0, d, amp=1.0):  # swell de ruído (antes do drop)
    t = tt(d)
    x = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    blocos = 40
    for k, idx in enumerate(np.array_split(np.arange(len(t)), blocos)):
        out[idx] = lp(x[idx], 400 + 7000 * (k / blocos) ** 2)
    por('fx', t0, amp * 0.18 * out * (t / d) ** 2)


# ---------------- arranjo ----------------
def batidas(a, b, sub=1):
    p = BAT / sub
    k0 = int(np.ceil((a - O) / p - 1e-9))
    t = O + k0 * p
    out = []
    while t < b - 1e-9:
        out.append(round(t, 6))
        t += p
    return out


# primeiro quadro: pad suave já soando (nada de silêncio no início)
pad(0.0, ACORDES[0]['pad'], 1.2, 0.9, 700, ataque=0.06, rel=0.6)

# Cenas 1-2: intro pulsante (baixo em colcheias, pad), entra kick suave e arpejo na Cena 2
for t in batidas(1.0, C[2], 2):
    a = acorde(t)
    fc = 350 + 900 * (t - 1) / (C[2] - 1)
    baixo(t, a['baixo'], 0.22, 0.8, fc)
for t in batidas(1.0, C[2], 1 / 4):
    pad(t, acorde(t)['pad'], 4 * BAT, 0.7, 900 + 600 * (t > C[1]))
for t in batidas(C[1], C[2]):
    kick(t, 0.55)
for t in batidas(C[1] + BAT / 2, C[2]):
    hat(t, 0.6)
for i, t in enumerate(batidas(C[1], C[2], 4)):
    pluck(t, acorde(t)['arp'][i % 4], 0.5, 2200)

# Cena 3: groove; abafa na falha; quase silêncio no "Resultado?"
for t in batidas(C[2], C[3]):
    kick(t, 0.85 if t < RESULT else 0.5)
for t in batidas(C[2] + BAT / 2, RESULT):
    hat(t, 0.8)
for t in batidas(C[2] + BAT, RESULT, 0.5):
    clap(t, 0.6)
for t in batidas(C[2], C[3], 2):
    baixo(t, acorde(t)['baixo'], 0.22, 1.0 if t < RESULT else 0.7, 1100)
for i, t in enumerate(batidas(C[2], RESULT, 4)):
    pluck(t, acorde(t)['arp'][(i * 3) % 4], 0.65, 3000)
for t in batidas(C[2], C[3], 1 / 4):
    pad(t, acorde(t)['pad'], 4 * BAT, 0.6 if t < RESULT else 0.9, 1400)

# Cena 4: build (kick em semínimas, caixa acelerando, filtro abrindo); corte seco em CORTE
for t in batidas(C[3], CORTE + 1.0):
    kick(t, 0.9)
for t in batidas(C[3] + BAT / 2, CORTE + 1.0):
    hat(t, 0.9, aberto=True)
for t in batidas(C[3], CORTE, 2):
    k = (t - C[3]) / (CORTE - C[3])
    baixo(t, acorde(t)['baixo'], 0.22, 1.0, 700 + 2500 * k)
for i, t in enumerate(batidas(C[3], CORTE + 1.0, 4)):
    k = min(1, (t - C[3]) / (CORTE - C[3]))
    pluck(t, acorde(t)['arp'][i % 4], 0.6 + 0.4 * k, 1800 + 5000 * k)
for t in batidas(CORTE - 4, CORTE - 2, 2):
    caixa(t, 0.55)
for t in batidas(CORTE - 2, CORTE - 1, 4):
    caixa(t, 0.7)
for t in batidas(CORTE - 1, CORTE, 8):
    caixa(t, 0.85)
for t in batidas(C[3], CORTE + 1.0, 1 / 4):
    pad(t, acorde(t)['pad'], 4 * BAT, 0.7, 1600)
for t in batidas(CORTE, CORTE + 1.0, 2):
    baixo(t, acorde(t)['baixo'], 0.22, 0.9, 900)

# Tensão (CORTE+SIL até o DROP): quase vazio, pad grave, batida de coração, swell no fim
pad(CORTE + 0.6, ['B2', 'F#3', 'D3'], DROP - CORTE - 0.8, 1.3, 800, ataque=0.6, rel=0.3)
for t in batidas(CORTE + 1.0, DROP, 2):
    baixo(t, 'B1', 0.2, 0.55 + 0.35 * (t - CORTE - 1.0) / (DROP - CORTE - 1.0), 450 + 600 * (t - CORTE - 1.0) / (DROP - CORTE - 1.0))
for t in batidas(DROP - 4, DROP, 1):
    kick(t, 0.35)
subida(DROP - 3.0, 3.0, 1.0)

# DROP: tudo junto (Cenas 5 a 6), mais leve na Cena 7
impacto(DROP, 1.0)
fim_cheio = C[6]
for t in batidas(DROP, C[7]):
    kick(t, 1.0 if t < fim_cheio else 0.8)
for t in batidas(DROP + BAT, C[7], 0.5):
    clap(t, 0.8 if t < fim_cheio else 0.5)
for t in batidas(DROP, C[7], 4 if True else 2):
    hat(t, 0.55 if t < fim_cheio else 0.4)
for t in batidas(DROP, C[7], 2):
    baixo(t, acorde(t)['baixo'], 0.22, 1.1, 1600)
for i, t in enumerate(batidas(DROP, C[7], 4)):
    pluck(t, acorde(t)['arp'][[0, 2, 1, 3, 2, 1, 3, 2][i % 8]], 0.8, 4200)
for t in batidas(DROP, fim_cheio, 1):
    off = t + BAT / 2
    if int(round((t - O) / BAT)) % 2 == 1:
        stab(off, acorde(off)['pad'], 0.9)
for t in batidas(DROP, C[7], 1 / 4):
    pad(t, acorde(t)['pad'], 4 * BAT, 0.9, 2600)

# Cena 8: pequena virada até "Agora é fazer chegar", acorde final grande, depois silêncio
for t in batidas(C[7], CHEGAR):
    kick(t, 0.8)
for t in batidas(CHEGAR - 1, CHEGAR, 4):
    caixa(t, 0.7)
subida(CHEGAR - 2.0, 2.0, 0.8)
impacto(CHEGAR, 0.9)
FINAL = ['D3', 'A3', 'D4', 'F#4', 'A4']
pad(CHEGAR, FINAL, 3.0, 1.6, 3000, ataque=0.02, rel=4.0)
stab(CHEGAR, ['D4', 'F#4', 'A4'], 1.4, 1.5)
baixo(CHEGAR, 'D2', 3.5, 1.0, 900)
pad(CHEGAR + 2.5, ['D3', 'A3', 'F#4'], DUR - CHEGAR - 2.5, 0.9, 1400, ataque=1.5, rel=0.05)

# ---------------- mix da trilha ----------------
niveis = {'bateria': 1.0, 'baixo': 0.9, 'pad': 0.8, 'arp': 0.75, 'stab': 0.7, 'fx': 0.9}
mix = sum(trilhas[k] * v for k, v in niveis.items())

t = np.arange(N) / SR
# abafa (passa-baixa) da falha da Cena 3 até o fim da Cena 3
saida = np.copy(mix)
zi = None
b0, a0 = butter(2, 0.5)
ini, fim = int(FALHA * SR), int(C[3] * SR)
estado = lfilter_zi(b0, a0) * 0
for idx in np.array_split(np.arange(ini, fim), 120):
    if len(idx) == 0:
        continue
    tm = idx[0] / SR
    fc = max(1100, 9000 * np.exp(-(tm - FALHA) * 3.2))
    b, a = butter(2, fc / (SR / 2))
    saida[idx], estado = lfilter(b, a, mix[idx], zi=estado)
# "Resultado?" e antes de "Nenhum projeto termina no go-live": a trilha CAI (~8 dB) e fica abafada,
# mas nunca para. Nenhum trecho do vídeo fica em silêncio total.
ganho = np.ones(N)
def rampa(a, b, g0, g1):
    m = (t >= a) & (t < b)
    ganho[m] *= g0 + (g1 - g0) * (t[m] - a) / (b - a)
def queda(a, b, db=-8.0, rampa=0.12):
    g = 10 ** (db / 20)
    m = (t >= a) & (t < b)
    ganho[m] = np.minimum(ganho[m], g)
    for x0, x1, v0, v1 in ((a - rampa, a, 1, g), (b, b + rampa, g, 1)):
        mm = (t >= x0) & (t < x1)
        ganho[mm] = np.minimum(ganho[mm], v0 + (v1 - v0) * (t[mm] - x0) / rampa)
queda(RESULT, C[3], -6.0)
queda(CORTE, CORTE + 1.0)
# passa-baixa também na queda antes da frase (cerca de 1 s)
estado2 = lfilter_zi(b0, a0) * 0
for idx in np.array_split(np.arange(int(CORTE * SR), int((CORTE + 1.0) * SR)), 40):
    tm = idx[0] / SR
    fc = 1100 + 8000 * max(0, (tm - (CORTE + 0.6)) / 0.4) ** 2
    b, a = butter(2, fc / (SR / 2))
    saida[idx], estado2 = lfilter(b, a, mix[idx], zi=estado2)
# dinâmica por seção: a intro respira, o build cresce, o drop é o ponto mais alto
rampa(0, C[1], 0.38, 0.45)
rampa(C[1], C[2], 0.5, 0.58)
rampa(C[2], C[3], 0.62, 0.62)
rampa(C[3], CORTE, 0.55, 0.95)
rampa(CORTE + 1.0, DROP, 0.6, 0.75)
rampa(DROP, C[6], 1.0, 1.0)
rampa(C[6], C[7], 0.72, 0.72)
rampa(C[7], DUR, 0.8, 0.8)
# sob a cartela final: o acorde segue baixinho até o último quadro (sem silêncio)
rampa(CHEGAR + 3.0, DUR, 1.0, 0.35)
saida *= ganho

# estéreo simples (pad e arpejo abertos)
larg = 0.0015
d = int(larg * SR)
esq = saida + 0.15 * np.roll(trilhas['pad'] + trilhas['arp'], d) * ganho
dir_ = saida + 0.15 * np.roll(trilhas['pad'] + trilhas['arp'], -d) * ganho
st = np.stack([esq, dir_], 1)
st /= np.abs(st).max() / 0.89  # pico ~-1 dBFS antes do ajuste
bruto = os.path.join(RAIZ, 'assets', 'trilha_bruta.wav')
import wave
with wave.open(bruto, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
# só ajuste de pico (-3 dBFS): a dinâmica fica; o master final leva tudo a -14 LUFS
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', bruto, '-af', 'volume=-2.0dB', '-ar', '48000',
                os.path.join(RAIZ, 'assets', 'trilha.wav')], check=True)
os.remove(bruto)
print(f'trilha.wav: {DUR:.1f}s, drop em {DROP}s, corte em {CORTE}s, acorde final em {CHEGAR}s')

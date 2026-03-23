// composables/useCalcoli.ts
// Calcoli lato client: bollo, assicurazione stimata, tagliandi

// ─────────────────────────────────────────────
// BOLLO — Formula ACI ufficiale
// Tariffa base:  €2.58/kW per i primi 100 kW
//                €3.87/kW per kW oltre i 100
// Maggiorazione regionale variabile
// Sconto anzianità: 0% < 5 anni | 30% 5-9 anni | 50% >= 10 anni
// ─────────────────────────────────────────────

export const MAGGIORAZIONI_REGIONALI: Record<string, { nome: string; perc: number }> = {
  AB: { nome: 'Abruzzo',            perc: 0 },
  BS: { nome: 'Basilicata',         perc: 0 },
  CL: { nome: 'Calabria',           perc: 10 },
  CP: { nome: 'Campania',           perc: 10 },
  EM: { nome: 'Emilia-Romagna',     perc: 0 },
  FG: { nome: 'Friuli-Venezia Giulia', perc: 0 },
  LZ: { nome: 'Lazio',              perc: 10 },
  LG: { nome: 'Liguria',            perc: 5 },
  LO: { nome: 'Lombardia',          perc: 0 },
  MR: { nome: 'Marche',             perc: 0 },
  ML: { nome: 'Molise',             perc: 0 },
  PM: { nome: 'Piemonte',           perc: 5 },
  PG: { nome: 'Puglia',             perc: 10 },
  SD: { nome: 'Sardegna',           perc: 0 },
  SC: { nome: 'Sicilia',            perc: 10 },
  TO: { nome: 'Toscana',            perc: 5 },
  TB: { nome: 'Trentino-Alto Adige',perc: 0 },
  UB: { nome: 'Umbria',             perc: 0 },
  VA: { nome: 'Valle d\'Aosta',     perc: 0 },
  VN: { nome: 'Veneto',             perc: 0 },
}

export interface RisultatoBollo {
  base: number
  maggiorazione: number
  sconto: number
  totale: number
  regione: string
  anno: number
}

export function calcolaBollo(
  kw: number,
  regioneCodice: string,
  annoImmatricolazione: number
): RisultatoBollo {
  const annoCorrente = new Date().getFullYear()
  const etaAnni = annoCorrente - annoImmatricolazione

  // Tariffa base
  const kw1 = Math.min(kw, 100)
  const kw2 = Math.max(0, kw - 100)
  const base = kw1 * 2.58 + kw2 * 3.87

  // Maggiorazione regionale
  const reg = MAGGIORAZIONI_REGIONALI[regioneCodice]
  const percMagg = reg?.perc ?? 0
  const maggiorazione = base * (percMagg / 100)

  // Sconto anzianità
  let percSconto = 0
  if (etaAnni >= 10) percSconto = 50
  else if (etaAnni >= 5) percSconto = 30

  const subtotale = base + maggiorazione
  const sconto = subtotale * (percSconto / 100)
  const totale = Math.max(subtotale - sconto, 5) // minimo €5

  return {
    base: round2(base),
    maggiorazione: round2(maggiorazione),
    sconto: round2(sconto),
    totale: round2(totale),
    regione: reg?.nome ?? regioneCodice,
    anno: annoImmatricolazione,
  }
}

// ─────────────────────────────────────────────
// ASSICURAZIONE — Stima euristica
// ─────────────────────────────────────────────

const FASCE_CC: { max: number; coeff: number }[] = [
  { max: 125,  coeff: 1.0 },
  { max: 300,  coeff: 1.4 },
  { max: 500,  coeff: 1.8 },
  { max: 750,  coeff: 2.3 },
  { max: 1000, coeff: 2.9 },
  { max: 9999, coeff: 3.6 },
]

const COEFF_CATEGORIA: Record<string, number> = {
  'Scooter':    0.85,
  'Custom':     0.90,
  'Touring':    0.90,
  'Scrambler':  1.00,
  'Adventure':  1.00,
  'Naked':      1.10,
  'Supermoto':  1.15,
  'Sportiva':   1.30,
}

// Coefficienti geografici Nord/Centro/Sud semplificati
const COEFF_REGIONE: Record<string, number> = {
  AB: 1.10, BS: 1.05, CL: 1.40, CP: 1.60,
  EM: 1.05, FG: 0.95, LZ: 1.35, LG: 1.10,
  LO: 1.15, MR: 0.95, ML: 1.00, PM: 1.00,
  PG: 1.45, SD: 0.95, SC: 1.40, TO: 1.05,
  TB: 0.90, UB: 0.95, VA: 0.90, VN: 1.00,
}

export interface RisultatoAssicurazione {
  min: number
  max: number
  nota: string
}

export function stimaAssicurazione(
  cilindrata: number,
  categoria: string,
  regioneCodice: string
): RisultatoAssicurazione {
  const BASE = 200 // euro base

  const fasciaCC = FASCE_CC.find(f => cilindrata <= f.max)!
  const coeffCC  = fasciaCC.coeff
  const coeffCat = COEFF_CATEGORIA[categoria] ?? 1.0
  const coeffReg = COEFF_REGIONE[regioneCodice] ?? 1.0

  const centro = BASE * coeffCC * coeffCat * coeffReg
  const min = round2(centro * 0.80)
  const max = round2(centro * 1.35)

  return {
    min,
    max,
    nota: 'Stima indicativa. Dipende da: età, esperienza, massimali e compagnia scelta.',
  }
}

// ─────────────────────────────────────────────
// TAGLIANDI — Stima per fascia cilindrata
// ─────────────────────────────────────────────

export interface RisultatoTagliando {
  intervalloKm: number
  costoMin: number
  costoMax: number
  nota: string
}

export function stimaTagliando(cilindrata: number): RisultatoTagliando {
  if (cilindrata <= 125) {
    return { intervalloKm: 4000, costoMin: 50, costoMax: 100,
      nota: 'Filtro aria, olio, candele.' }
  }
  if (cilindrata <= 400) {
    return { intervalloKm: 6000, costoMin: 80, costoMax: 160,
      nota: 'Olio + filtro olio, filtro aria, candele.' }
  }
  if (cilindrata <= 800) {
    return { intervalloKm: 8000, costoMin: 130, costoMax: 260,
      nota: 'Olio + filtri, candele, catena, freni.' }
  }
  if (cilindrata <= 1200) {
    return { intervalloKm: 10000, costoMin: 200, costoMax: 400,
      nota: 'Olio + filtri, candele, catena, freni, valvole ogni 24.000 km.' }
  }
  return { intervalloKm: 12000, costoMin: 300, costoMax: 600,
    nota: 'Moto di alta cilindrata — costi di manutenzione elevati.' }
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function formatEuro(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

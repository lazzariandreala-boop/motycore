<template>
  <div class="container">

    <div class="page-header fade-in">
      <h1 class="page-title">⚖️ Confronto moto</h1>
      <p class="text-muted">Seleziona fino a 3 moto dal catalogo e confrontale fianco a fianco.</p>
    </div>

    <!-- SELEZIONE MOTO -->
    <div class="slot-row fade-in">
      <div
        v-for="(slot, i) in slots"
        :key="i"
        class="slot-box card"
        :class="{ filled: slot }"
      >
        <template v-if="slot">
          <div class="slot-marca">{{ slot.marca }}</div>
          <div class="slot-modello">{{ slot.modello }}</div>
          <div class="slot-meta text-muted">{{ slot.cilindrata }} cc · {{ slot.cv }} CV</div>
          <button class="slot-remove btn btn-ghost" @click="removeSlot(i)">✕ Rimuovi</button>
        </template>
        <template v-else>
          <div class="slot-empty">
            <div class="slot-icon">+</div>
            <div class="text-muted" style="font-size:14px;">Slot {{ i + 1 }}</div>
            <button class="btn btn-ghost mt-2" @click="openPicker(i)" style="font-size:13px;">
              Scegli moto
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- PICKER MODALE -->
    <div v-if="pickerAperto !== null" class="picker-overlay" @click.self="pickerAperto = null">
      <div class="picker-modal card">
        <div class="picker-header">
          <span style="font-family:var(--font-display);font-size:20px;font-weight:700;">
            Scegli una moto
          </span>
          <button class="btn btn-ghost" @click="pickerAperto = null">✕</button>
        </div>
        <input
          v-model="pickerCerca"
          class="input"
          placeholder="Cerca marca o modello..."
          @input="cercaPicker"
        />
        <div class="picker-list">
          <div
            v-for="m in pickerRisultati"
            :key="m.id"
            class="picker-item"
            @click="selectMoto(m)"
          >
            <div>
              <span class="text-muted" style="font-size:12px;">{{ m.marca }}</span>
              <div style="font-family:var(--font-display);font-size:18px;font-weight:700;">{{ m.modello }}</div>
            </div>
            <div class="text-accent" style="font-family:var(--font-display);font-size:16px;font-weight:700;">
              {{ m.cv }} CV
            </div>
          </div>
          <div v-if="!pickerRisultati.length" class="text-muted" style="padding:24px;text-align:center;">
            Nessuna moto trovata
          </div>
        </div>
      </div>
    </div>

    <!-- TABELLA CONFRONTO -->
    <div v-if="motoSelezionate.length" class="confronto-section fade-in">
      <h2 class="section-title">Confronto</h2>

      <!-- Riga header -->
      <div class="confronto-table" :style="`grid-template-columns: 160px repeat(${motoSelezionate.length}, 1fr)`">

        <div class="tbl-label"></div>
        <div
          v-for="m in motoSelezionate"
          :key="m.id"
          class="tbl-header"
        >
          <div class="tbl-marca">{{ m.marca }}</div>
          <div class="tbl-modello">{{ m.modello }}</div>
        </div>

        <!-- Riga: CV -->
        <div class="tbl-label">Potenza</div>
        <div
          v-for="m in motoSelezionate"
          :key="m.id + 'cv'"
          class="tbl-cell"
          :class="{ best: m.cv === maxVal('cv') }"
        >
          <span class="tbl-val">{{ m.cv }}</span>
          <span class="tbl-unit">CV</span>
        </div>

        <!-- Riga: kW -->
        <div class="tbl-label">kW</div>
        <div v-for="m in motoSelezionate" :key="m.id + 'kw'" class="tbl-cell">
          <span class="tbl-val">{{ m.kw }}</span>
          <span class="tbl-unit">kW</span>
        </div>

        <!-- Riga: CC -->
        <div class="tbl-label">Cilindrata</div>
        <div
          v-for="m in motoSelezionate"
          :key="m.id + 'cc'"
          class="tbl-cell"
          :class="{ best: m.cilindrata === maxVal('cilindrata') }"
        >
          <span class="tbl-val">{{ m.cilindrata }}</span>
          <span class="tbl-unit">cc</span>
        </div>

        <!-- Riga: Peso -->
        <div class="tbl-label">Peso</div>
        <div
          v-for="m in motoSelezionate"
          :key="m.id + 'kg'"
          class="tbl-cell"
          :class="{ lightest: m.peso_kg && m.peso_kg === minVal('peso_kg') }"
        >
          <span class="tbl-val">{{ m.peso_kg ?? '—' }}</span>
          <span class="tbl-unit" v-if="m.peso_kg">kg</span>
        </div>

        <!-- Riga: Categoria -->
        <div class="tbl-label">Categoria</div>
        <div v-for="m in motoSelezionate" :key="m.id + 'cat'" class="tbl-cell tbl-cell-text">
          <span class="badge">{{ m.categoria ?? '—' }}</span>
        </div>

        <!-- Riga: Anni -->
        <div class="tbl-label">Produzione</div>
        <div v-for="m in motoSelezionate" :key="m.id + 'anni'" class="tbl-cell tbl-cell-text">
          {{ m.anno_inizio }}{{ m.anno_fine ? `–${m.anno_fine}` : '→' }}
        </div>

        <!-- Riga: Power/Weight -->
        <div class="tbl-label">CV/kg</div>
        <div
          v-for="m in motoSelezionate"
          :key="m.id + 'pw'"
          class="tbl-cell"
          :class="{ best: cvPerKg(m) === maxCvPerKg }"
        >
          <span class="tbl-val">{{ cvPerKg(m) ?? '—' }}</span>
        </div>

        <!-- Riga: Bollo stimato (VN - Veneto) -->
        <div class="tbl-label">Bollo* <small style="font-size:10px;display:block;color:var(--text-faint);">(Veneto, anno inizio)</small></div>
        <div
          v-for="m in motoSelezionate"
          :key="m.id + 'bollo'"
          class="tbl-cell tbl-cell-text"
          :class="{ cheapest: bolloCheapest(m) }"
        >
          <span class="text-green">{{ formatEuro(calcolaBollo(m.kw, 'VN', m.anno_inizio).totale) }}</span>
        </div>

        <!-- Riga: Link scheda -->
        <div class="tbl-label"></div>
        <div v-for="m in motoSelezionate" :key="m.id + 'link'" class="tbl-cell tbl-cell-text">
          <NuxtLink :to="`/moto/${m.id}`" class="btn btn-accent-outline" style="font-size:12px;padding:6px 14px;">
            Scheda →
          </NuxtLink>
        </div>

      </div>
      <p class="note text-muted">* Bollo calcolato su Veneto, anno di inizio produzione, senza sconti anzianità.</p>
    </div>

    <div v-else-if="!motoSelezionate.length" class="empty-state fade-in">
      <div class="empty-icon">⚖️</div>
      <div class="empty-title">Nessuna moto selezionata</div>
      <div class="text-muted">Usa i tasti "Scegli moto" qui sopra, o torna al catalogo e usa il pulsante Confronta.</div>
      <NuxtLink to="/" class="btn btn-primary mt-4">Vai al catalogo</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Moto } from '~/composables/useMotyDb'
import { calcolaBollo, formatEuro } from '~/composables/useCalcoli'

const route = useRoute()
const { getMoto, getMotoConfronto } = useMotyDb()

// 3 slot fissi
const slots = ref<(Moto | null)[]>([null, null, null])

const motoSelezionate = computed<Moto[]>(() => slots.value.filter(Boolean) as Moto[])

// Picker
const pickerAperto    = ref<number | null>(null)
const pickerCerca     = ref('')
const pickerRisultati = ref<Moto[]>([])
const pickerTutte     = ref<Moto[]>([])

// ───────────────────────────────────────────
// Init: leggi ?ids=1,2,3 dalla query string
// ───────────────────────────────────────────
onMounted(async () => {
  const idsParam = route.query.ids as string | undefined
  if (idsParam) {
    const ids = idsParam.split(',').map(Number).filter(Boolean).slice(0, 3)
    if (ids.length) {
      const moto = await getMotoConfronto(ids)
      ids.forEach((id, i) => {
        const found = moto.find(m => m.id === id)
        if (found) slots.value[i] = found
      })
    }
  }

  // Pre-carica tutte le moto per il picker
  const { moto } = await getMoto({}, 0, 999)
  pickerTutte.value = moto
  pickerRisultati.value = moto.slice(0, 40)
})

// ───────────────────────────────────────────
// Picker
// ───────────────────────────────────────────
function openPicker(i: number) {
  pickerAperto.value = i
  pickerCerca.value = ''
  pickerRisultati.value = pickerTutte.value.slice(0, 40)
}

function cercaPicker() {
  const q = pickerCerca.value.toLowerCase()
  if (!q) {
    pickerRisultati.value = pickerTutte.value.slice(0, 40)
    return
  }
  pickerRisultati.value = pickerTutte.value.filter(
    m => m.marca.toLowerCase().includes(q) || m.modello.toLowerCase().includes(q)
  ).slice(0, 30)
}

function selectMoto(m: Moto) {
  if (pickerAperto.value === null) return
  slots.value[pickerAperto.value] = m
  pickerAperto.value = null
}

function removeSlot(i: number) {
  slots.value[i] = null
}

// ───────────────────────────────────────────
// Helpers per evidenziare best/worst
// ───────────────────────────────────────────
function maxVal(field: keyof Moto) {
  const vals = motoSelezionate.value.map(m => m[field] as number).filter(Boolean)
  return vals.length ? Math.max(...vals) : null
}
function minVal(field: keyof Moto) {
  const vals = motoSelezionate.value.map(m => m[field] as number).filter(Boolean)
  return vals.length ? Math.min(...vals) : null
}
function cvPerKg(m: Moto) {
  if (!m.peso_kg) return null
  return (m.cv / m.peso_kg).toFixed(2)
}
const maxCvPerKg = computed(() => {
  const vals = motoSelezionate.value
    .map(m => m.peso_kg ? parseFloat((m.cv / m.peso_kg).toFixed(2)) : 0)
  return vals.length ? Math.max(...vals) : null
})
function bolloCheapest(m: Moto) {
  const bollos = motoSelezionate.value.map(x => calcolaBollo(x.kw, 'VN', x.anno_inizio).totale)
  return calcolaBollo(m.kw, 'VN', m.anno_inizio).totale === Math.min(...bollos)
}

useSeoMeta({
  title: 'Confronta moto — MotyCore',
  description: 'Confronta le specifiche tecniche di più moto fianco a fianco.',
})
</script>

<style scoped>
.page-header {
  margin-bottom: 40px;
}
.page-title {
  font-size: clamp(32px, 6vw, 56px);
  font-weight: 900;
  margin-bottom: 8px;
}

/* SLOT ROW */
.slot-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 48px;
}
.slot-box {
  padding: 20px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.slot-box.filled {
  border-color: var(--accent);
  background: var(--accent-glow);
}
.slot-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.slot-icon {
  font-size: 36px;
  color: var(--text-faint);
  line-height: 1;
}
.slot-marca {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}
.slot-modello {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
}
.slot-meta { font-size: 13px; }
.slot-remove {
  margin-top: auto;
  font-size: 12px;
  padding: 6px 12px;
  align-self: flex-start;
}

/* PICKER OVERLAY */
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.picker-modal {
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  overflow: hidden;
}
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.picker-list {
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.15s;
}
.picker-item:hover {
  background: var(--bg-elevated);
}

/* CONFRONTO TABLE */
.confronto-section { margin-top: 16px; }
.section-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.confronto-table {
  display: grid;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  overflow-x: auto;
}

/* Ogni coppia label+celle */
.tbl-label {
  padding: 14px 16px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.tbl-header {
  padding: 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
}
.tbl-marca {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
}
.tbl-modello {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 900;
  margin-top: 2px;
}
.tbl-cell {
  padding: 14px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 4px;
}
.tbl-cell.best {
  background: rgba(255,106,0,0.08);
}
.tbl-cell.lightest {
  background: rgba(45,206,106,0.08);
}
.tbl-cell.cheapest {
  background: rgba(45,206,106,0.08);
}
.tbl-cell-text {
  align-items: center;
  font-size: 14px;
}
.tbl-val {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 900;
}
.tbl-unit {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
}

.note {
  font-size: 12px;
  margin-top: 12px;
}

/* EMPTY */
.empty-state {
  text-align: center;
  padding: 80px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon { font-size: 64px; }
.empty-title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .slot-row { grid-template-columns: 1fr; }
  .confronto-table { font-size: 14px; }
}
</style>

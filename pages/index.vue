<template>
  <div class="container">

    <!-- HERO -->
    <section class="hero fade-in">
      <div class="hero-tag badge badge-accent">Beta — {{ totaleMoto }} moto nel catalogo</div>
      <h1 class="hero-title">
        Ogni moto.<br>
        <span class="text-accent">Ogni dato.</span>
      </h1>
      <p class="hero-sub text-muted">
        Schede tecniche, confronto, calcolo bollo e stima assicurazione.<br>
        Tutto in un posto solo.
      </p>
    </section>

    <!-- FILTRI -->
    <section class="filtri-section fade-in">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="filtri.cerca"
          class="input search-input"
          placeholder="Cerca marca o modello..."
          @input="debouncedLoad"
        />
      </div>

      <div class="select-row">
        <select v-model="filtri.marca" class="input" @change="loadMoto">
          <option value="">Tutte le marche</option>
          <option v-for="m in marche" :key="m" :value="m">{{ m }}</option>
        </select>

        <select v-model="filtri.categoria" class="input" @change="loadMoto">
          <option value="">Tutte le categorie</option>
          <option v-for="c in categorie" :key="c" :value="c">{{ c }}</option>
        </select>

        <select v-model="filtri.ccRange" class="input" @change="loadMoto">
          <option value="">Qualsiasi cilindrata</option>
          <option value="0-125">Fino a 125 cc</option>
          <option value="126-400">126 – 400 cc</option>
          <option value="401-750">401 – 750 cc</option>
          <option value="751-1000">751 – 1000 cc</option>
          <option value="1001-9999">Oltre 1000 cc</option>
        </select>

        <button class="btn btn-ghost" @click="resetFiltri">✕ Reset</button>
      </div>
    </section>

    <!-- RISULTATI COUNT -->
    <div class="results-row">
      <span class="text-muted" style="font-size:14px;">
        <span class="text-accent" style="font-weight:700;">{{ totaleMoto }}</span>
        moto trovate
      </span>
      <div class="confronta-bar" v-if="confrontoList.length">
        <span class="text-muted" style="font-size:13px;">{{ confrontoList.length }}/3 selezionate</span>
        <NuxtLink
          :to="`/confronta?ids=${confrontoList.join(',')}`"
          class="btn btn-primary"
          style="font-size:13px; padding:8px 16px;"
        >
          ⚖️ Confronta ora
        </NuxtLink>
      </div>
    </div>

    <!-- LOADING SKELETON -->
    <div v-if="loading" class="moto-grid">
      <div v-for="i in 12" :key="i" class="skeleton" style="height:180px;"></div>
    </div>

    <!-- GRIGLIA MOTO -->
    <div v-else-if="moto.length" class="moto-grid fade-in">
      <MotoCard
        v-for="m in moto"
        :key="m.id"
        :moto="m"
        :show-confronta="true"
        :is-selected="confrontoList.includes(m.id)"
        @toggle-confronto="toggleConfronto"
      />
    </div>

    <!-- EMPTY STATE -->
    <div v-else class="empty-state">
      <div class="empty-icon">🏍️</div>
      <div class="empty-title">Nessuna moto trovata</div>
      <div class="text-muted">Prova a cambiare i filtri di ricerca</div>
    </div>

    <!-- PAGINAZIONE -->
    <div class="pagination" v-if="!loading && totaleMoto > perPage">
      <button
        class="btn btn-ghost"
        :disabled="paginaCorrente === 0"
        @click="cambiaPage(paginaCorrente - 1)"
      >← Prec.</button>

      <span class="page-info text-muted">
        Pagina {{ paginaCorrente + 1 }} di {{ totalePagine }}
      </span>

      <button
        class="btn btn-ghost"
        :disabled="paginaCorrente >= totalePagine - 1"
        @click="cambiaPage(paginaCorrente + 1)"
      >Succ. →</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Moto } from '~/composables/useMotyDb'

const { getMoto, getMarche, getCategorie } = useMotyDb()

// State
const moto       = ref<Moto[]>([])
const loading    = ref(true)
const totaleMoto = ref(0)
const paginaCorrente = ref(0)
const perPage    = 24
const confrontoList = ref<number[]>([])

const filtri = reactive({
  cerca: '',
  marca: '',
  categoria: '',
  ccRange: '',
})

// Dati per select
const marche    = ref<string[]>([])
const categorie = ref<string[]>([])

// Computed
const totalePagine = computed(() => Math.ceil(totaleMoto.value / perPage))

// Helpers
function parseCcRange(range: string) {
  if (!range) return {}
  const [min, max] = range.split('-').map(Number)
  return { ccMin: min, ccMax: max }
}

// Load
async function loadMoto() {
  loading.value = true
  try {
    const { moto: data, total } = await getMoto(
      {
        marca: filtri.marca || undefined,
        categoria: filtri.categoria || undefined,
        cerca: filtri.cerca || undefined,
        ...parseCcRange(filtri.ccRange),
      },
      paginaCorrente.value,
      perPage
    )
    moto.value = data
    totaleMoto.value = total
  } finally {
    loading.value = false
  }
}

function cambiaPage(n: number) {
  paginaCorrente.value = n
  loadMoto()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetFiltri() {
  filtri.cerca = ''
  filtri.marca = ''
  filtri.categoria = ''
  filtri.ccRange = ''
  paginaCorrente.value = 0
  loadMoto()
}

// Debounce per la ricerca testuale
let debounceTimer: ReturnType<typeof setTimeout>
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    paginaCorrente.value = 0
    loadMoto()
  }, 350)
}

// Confronto
function toggleConfronto(m: Moto) {
  const idx = confrontoList.value.indexOf(m.id)
  if (idx >= 0) {
    confrontoList.value.splice(idx, 1)
  } else if (confrontoList.value.length < 3) {
    confrontoList.value.push(m.id)
  }
}

// Init
onMounted(async () => {
  ;[marche.value, categorie.value] = await Promise.all([getMarche(), getCategorie()])
  await loadMoto()
})

useSeoMeta({
  title: 'MotyCore — Catalogo Moto',
  description: 'Cerca tra centinaia di moto. Schede tecniche, calcolo bollo, stima assicurazione.',
})
</script>

<style scoped>
/* HERO */
.hero {
  padding: 60px 0 48px;
  max-width: 600px;
}
.hero-tag {
  margin-bottom: 20px;
  display: inline-block;
}
.hero-title {
  font-size: clamp(48px, 8vw, 80px);
  font-weight: 900;
  line-height: 1;
  margin-bottom: 20px;
}
.hero-sub {
  font-size: 18px;
  line-height: 1.7;
}

/* FILTRI */
.filtri-section {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.search-wrap {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
}
.search-input { padding-left: 42px; }

.select-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.select-row .input {
  flex: 1;
  min-width: 160px;
}

/* RESULTS ROW */
.results-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.confronta-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 8px 16px;
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

/* PAGINATION */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 48px;
}
.page-info { font-size: 14px; }

@media (max-width: 640px) {
  .select-row { flex-direction: column; }
  .select-row .input { width: 100%; }
}
</style>

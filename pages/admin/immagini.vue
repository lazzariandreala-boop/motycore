<template>
  <div class="container">
    <NuxtLink to="/" class="back-link text-muted">← Catalogo</NuxtLink>

    <div class="admin-header">
      <div>
        <h1 class="page-title">Gestione immagini</h1>
        <p class="text-muted" style="font-size:14px; margin-top:6px;">
          Popola automaticamente le immagini mancanti tramite Wikipedia
        </p>
      </div>
      <button
        class="btn btn-primary"
        :disabled="inCorso"
        @click="avviaBatch"
      >
        {{ inCorso ? `Elaborazione ${elaborati}/${totale}…` : 'Avvia ricerca immagini' }}
      </button>
    </div>

    <!-- Riepilogo -->
    <div v-if="completato" class="summary-card card">
      <div class="summary-row">
        <span class="text-muted">Moto elaborate</span>
        <span>{{ totale }}</span>
      </div>
      <div class="summary-row">
        <span class="text-muted">Immagini trovate</span>
        <span class="text-accent">{{ trovate }}</span>
      </div>
      <div class="summary-row">
        <span class="text-muted">Non trovate</span>
        <span>{{ totale - trovate }}</span>
      </div>
    </div>

    <!-- Caricamento lista -->
    <div v-if="caricando" class="skeleton" style="height:200px; margin-top:32px;"></div>

    <!-- Griglia moto -->
    <div v-else class="moto-grid">
      <div
        v-for="m in moto"
        :key="m.id"
        class="moto-img-card card"
        :class="{ 'has-image': m.immagine_url, 'not-found': risultati[m.id] === 'not-found' }"
      >
        <!-- Immagine (attuale o trovata in batch) -->
        <div class="img-wrap">
          <img
            v-if="m.immagine_url"
            :src="m.immagine_url"
            :alt="`${m.marca} ${m.modello}`"
            class="moto-img"
          />
          <div v-else class="img-placeholder">
            <span>{{ m.marca[0] }}</span>
          </div>
          <!-- Badge stato -->
          <span v-if="risultati[m.id] === 'salvata'" class="badge-stato saved">✓</span>
          <span v-else-if="risultati[m.id] === 'not-found'" class="badge-stato missing">✗</span>
          <span v-else-if="risultati[m.id] === 'pending'" class="badge-stato pending">…</span>
        </div>

        <div class="moto-info">
          <div class="marca-label">{{ m.marca }}</div>
          <div class="modello-label">{{ m.modello }}</div>
          <div class="anno-label text-muted">{{ m.anno_inizio }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cercaImmagineWikipedia } from '~/composables/useWikipediaImage'

const { getTutteLeMoto, updateImmagineUrl } = useMotyDb()
const config = useRuntimeConfig()

const moto      = ref<any[]>([])
const caricando = ref(true)
const inCorso   = ref(false)
const completato= ref(false)
const elaborati = ref(0)
const totale    = ref(0)
const trovate   = ref(0)
const risultati = reactive<Record<number, 'pending' | 'salvata' | 'not-found'>>({})

onMounted(async () => {
  try {
    moto.value = await getTutteLeMoto()
  } finally {
    caricando.value = false
  }
})

async function avviaBatch() {
  inCorso.value   = true
  completato.value= false
  elaborati.value = 0
  trovate.value   = 0
  totale.value    = moto.value.length

  const opts = {
    googleCseKey: config.public.googleCseKey as string | undefined,
    googleCseCx:  config.public.googleCseCx  as string | undefined,
  }

  for (const m of moto.value) {
    risultati[m.id] = 'pending'
    const url = await cercaImmagineWikipedia(m.marca, m.modello, m.anno_inizio, opts)

    if (url) {
      try {
        await updateImmagineUrl(m.id, url)
        m.immagine_url  = url
        risultati[m.id] = 'salvata'
        trovate.value++
      } catch {
        risultati[m.id] = 'not-found'
      }
    } else {
      risultati[m.id] = 'not-found'
    }

    elaborati.value++
    // Piccola pausa per non saturare Wikipedia API
    await new Promise(r => setTimeout(r, 120))
  }

  inCorso.value    = false
  completato.value = true
}

useSeoMeta({ title: 'Admin — Immagini | MotyCore' })
</script>

<style scoped>
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.page-title {
  font-size: 36px;
  font-weight: 900;
  font-family: var(--font-display);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 32px;
  transition: color 0.2s;
}
.back-link:hover { color: var(--text); }

.summary-card {
  display: flex;
  gap: 32px;
  padding: 20px 24px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}
.summary-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
}
.summary-row .text-muted { font-family: var(--font-body, inherit); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }

.moto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
.moto-img-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  transition: border-color 0.2s;
}
.moto-img-card.has-image { border-color: var(--accent); }
.moto-img-card.not-found { opacity: 0.5; }

.img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: var(--bg-elevated);
}
.moto-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 900;
  color: var(--border);
}

.badge-stato {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}
.badge-stato.saved   { background: var(--accent); color: #000; }
.badge-stato.missing { background: #555; color: var(--text-muted); }
.badge-stato.pending { background: var(--bg-card); color: var(--text-muted); border: 1px solid var(--border); }

.moto-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.marca-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.modello-label {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.1;
}
.anno-label { font-size: 12px; }
</style>

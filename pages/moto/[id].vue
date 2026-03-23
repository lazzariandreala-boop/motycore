<template>
  <div class="container">

    <!-- BACK -->
    <NuxtLink to="/" class="back-link text-muted">← Catalogo</NuxtLink>

    <!-- LOADING -->
    <div v-if="loading" class="detail-skeleton">
      <div class="skeleton" style="height:48px; width:300px;"></div>
      <div class="skeleton" style="height:24px; width:180px; margin-top:12px;"></div>
      <div class="skeleton" style="height:200px; margin-top:32px;"></div>
    </div>

    <template v-else-if="moto">

      <!-- HEADER -->
      <div class="detail-header fade-in">
        <div>
          <div class="marca-label">{{ moto.marca }}</div>
          <h1 class="modello-title">
            {{ moto.modello }}
            <span v-if="moto.versione" class="versione-label"> {{ moto.versione }}</span>
          </h1>
          <div class="meta-row">
            <span class="badge" v-if="moto.categoria">{{ moto.categoria }}</span>
            <span class="anni text-muted">
              {{ moto.anno_inizio }}{{ moto.anno_fine ? ` – ${moto.anno_fine}` : ' – oggi' }}
            </span>
          </div>
        </div>

        <NuxtLink :to="`/confronta?ids=${moto.id}`" class="btn btn-accent-outline">
          ⚖️ Aggiungi al confronto
        </NuxtLink>
      </div>

      <!-- IMMAGINE HERO -->
      <div v-if="moto.immagine_url" class="hero-img-wrap fade-in">
        <img :src="moto.immagine_url" :alt="`${moto.marca} ${moto.modello}`" class="hero-img" />
      </div>

      <!-- SCHEDA TECNICA -->
      <section class="section fade-in">
        <h2 class="section-title">Scheda tecnica</h2>
        <div class="specs-grid">
          <div class="spec-item">
            <div class="spec-label">Potenza</div>
            <div class="spec-value text-accent">{{ moto.cv }} <span class="spec-unit">CV</span></div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Potenza</div>
            <div class="spec-value">{{ moto.kw }} <span class="spec-unit">kW</span></div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Cilindrata</div>
            <div class="spec-value">{{ moto.cilindrata }} <span class="spec-unit">cc</span></div>
          </div>
          <div class="spec-item" v-if="moto.peso_kg">
            <div class="spec-label">Peso</div>
            <div class="spec-value">{{ moto.peso_kg }} <span class="spec-unit">kg</span></div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Produzione</div>
            <div class="spec-value" style="font-size:22px;">
              {{ moto.anno_inizio }}{{ moto.anno_fine ? `–${moto.anno_fine}` : '→' }}
            </div>
          </div>
        </div>
      </section>

      <!-- CALCOLO BOLLO -->
      <section class="section fade-in">
        <h2 class="section-title">📋 Calcola il bollo</h2>

        <div class="calc-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Anno immatricolazione</label>
              <input
                v-model.number="bolloParams.anno"
                type="number"
                class="input"
                :min="moto.anno_inizio"
                :max="new Date().getFullYear()"
                :placeholder="`es. ${moto.anno_inizio}`"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Regione</label>
              <select v-model="bolloParams.regione" class="input">
                <option value="">Seleziona regione</option>
                <option v-for="(r, key) in MAGGIORAZIONI_REGIONALI" :key="key" :value="key">
                  {{ r.nome }} {{ r.perc > 0 ? `(+${r.perc}%)` : '' }}
                </option>
              </select>
            </div>
            <div class="form-group form-group-btn">
              <button class="btn btn-primary w-full" @click="calcolaBolloMoto">
                Calcola
              </button>
            </div>
          </div>

          <div v-if="bolloResult" class="result-card fade-in">
            <div class="result-row">
              <span class="text-muted">Base ({{ moto.kw }} kW)</span>
              <span>{{ formatEuro(bolloResult.base) }}</span>
            </div>
            <div class="result-row" v-if="bolloResult.maggiorazione > 0">
              <span class="text-muted">Maggiorazione {{ bolloResult.regione }}</span>
              <span>+ {{ formatEuro(bolloResult.maggiorazione) }}</span>
            </div>
            <div class="result-row text-green" v-if="bolloResult.sconto > 0">
              <span>Sconto anzianità</span>
              <span>− {{ formatEuro(bolloResult.sconto) }}</span>
            </div>
            <div class="divider"></div>
            <div class="result-row result-total">
              <span>Totale annuo</span>
              <span class="text-accent">{{ formatEuro(bolloResult.totale) }}</span>
            </div>
            <div class="result-note text-muted">
              * Importo indicativo basato sulla formula ACI. Verifica sul sito ACI o PRA.
            </div>
          </div>
        </div>
      </section>

      <!-- STIMA ASSICURAZIONE -->
      <section class="section fade-in">
        <h2 class="section-title">🛡️ Stima assicurazione</h2>

        <div class="calc-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Regione</label>
              <select v-model="assicParams.regione" class="input">
                <option value="">Seleziona regione</option>
                <option v-for="(r, key) in MAGGIORAZIONI_REGIONALI" :key="key" :value="key">
                  {{ r.nome }}
                </option>
              </select>
            </div>
            <div class="form-group form-group-btn">
              <button class="btn btn-primary w-full" @click="calcolaAssicurazione">
                Stima
              </button>
            </div>
          </div>

          <div v-if="assicResult" class="result-card fade-in">
            <div class="result-row result-total">
              <span>Fascia stimata</span>
              <span class="text-accent">
                {{ formatEuro(assicResult.min) }} – {{ formatEuro(assicResult.max) }}
              </span>
            </div>
            <div class="result-note text-muted">{{ assicResult.nota }}</div>
          </div>
        </div>
      </section>

      <!-- TAGLIANDI -->
      <section class="section fade-in">
        <h2 class="section-title">🔧 Manutenzione stimata</h2>
        <div class="result-card" style="margin-top:0;">
          <div class="result-row">
            <span class="text-muted">Intervallo tagliando</span>
            <span>ogni <strong>{{ tagliando.intervalloKm.toLocaleString('it-IT') }} km</strong></span>
          </div>
          <div class="result-row">
            <span class="text-muted">Costo stimato</span>
            <span>{{ formatEuro(tagliando.costoMin) }} – {{ formatEuro(tagliando.costoMax) }}</span>
          </div>
          <div class="divider"></div>
          <div class="result-note text-muted">{{ tagliando.nota }}</div>
        </div>
      </section>

      <!-- VIDEO YOUTUBE -->
      <section class="section fade-in">
        <h2 class="section-title">▶ Recensioni video</h2>
        <div v-if="loadingVideo" class="skeleton" style="height:80px;"></div>
        <div v-else-if="video.length" class="video-list">
          <a
            v-for="v in video"
            :key="v.id"
            :href="`https://www.youtube.com/watch?v=${v.id}`"
            target="_blank"
            class="video-item card"
          >
            <img :src="v.thumb" :alt="v.title" class="video-thumb" />
            <div class="video-info">
              <div class="video-title">{{ v.title }}</div>
              <div class="video-channel text-muted">{{ v.channel }}</div>
            </div>
          </a>
        </div>
        <div v-else class="text-muted" style="font-size:14px;">
          Nessun video trovato. Configura YOUTUBE_API_KEY nel .env per abilitare questa funzionalità.
        </div>
      </section>

    </template>

    <!-- ERROR -->
    <div v-else class="empty-state">
      <div class="empty-icon">❌</div>
      <div>Moto non trovata</div>
      <NuxtLink to="/" class="btn btn-ghost mt-4">Torna al catalogo</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Moto } from '~/composables/useMotyDb'
import {
  calcolaBollo,
  stimaAssicurazione,
  stimaTagliando,
  formatEuro,
  MAGGIORAZIONI_REGIONALI,
  type RisultatoBollo,
  type RisultatoAssicurazione,
  type RisultatoTagliando,
} from '~/composables/useCalcoli'

const route = useRoute()
const config = useRuntimeConfig()
const { getMotoById } = useMotyDb()

const moto    = ref<Moto | null>(null)
const loading = ref(true)

// Bollo
const bolloParams  = reactive({ anno: 0, regione: '' })
const bolloResult  = ref<RisultatoBollo | null>(null)

// Assicurazione
const assicParams  = reactive({ regione: '' })
const assicResult  = ref<RisultatoAssicurazione | null>(null)

// Tagliando
const tagliando    = ref<RisultatoTagliando>({ intervalloKm: 0, costoMin: 0, costoMax: 0, nota: '' })

// Video
interface VideoItem { id: string; title: string; thumb: string; channel: string }
const video        = ref<VideoItem[]>([])
const loadingVideo = ref(false)

// ───────────────────────────────────────────
// Load moto
// ───────────────────────────────────────────
onMounted(async () => {
  try {
    moto.value = await getMotoById(Number(route.params.id))
    if (moto.value) {
      bolloParams.anno = moto.value.anno_inizio
      tagliando.value  = stimaTagliando(moto.value.cilindrata)
      await loadVideo()
    }
  } catch {
    moto.value = null
  } finally {
    loading.value = false
  }
})

// ───────────────────────────────────────────
// Calcoli
// ───────────────────────────────────────────
function calcolaBolloMoto() {
  if (!moto.value || !bolloParams.regione || !bolloParams.anno) return
  bolloResult.value = calcolaBollo(moto.value.kw, bolloParams.regione, bolloParams.anno)
}

function calcolaAssicurazione() {
  if (!moto.value || !assicParams.regione) return
  assicResult.value = stimaAssicurazione(
    moto.value.cilindrata,
    moto.value.categoria ?? 'Naked',
    assicParams.regione
  )
}

// ───────────────────────────────────────────
// YouTube
// ───────────────────────────────────────────
async function loadVideo() {
  const apiKey = config.public.youtubeApiKey
  if (!apiKey || !moto.value) return

  loadingVideo.value = true
  try {
    const q = encodeURIComponent(`${moto.value.marca} ${moto.value.modello} recensione test`)
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=4&key=${apiKey}`
    const res  = await fetch(url)
    const data = await res.json()

    video.value = (data.items ?? []).map((item: any) => ({
      id:      item.id.videoId,
      title:   item.snippet.title,
      thumb:   item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
    }))
  } catch {
    video.value = []
  } finally {
    loadingVideo.value = false
  }
}

// SEO dinamico
watchEffect(() => {
  if (moto.value) {
    useSeoMeta({
      title: `${moto.value.marca} ${moto.value.modello} — MotyCore`,
      description: `Scheda tecnica, bollo e assicurazione per ${moto.value.marca} ${moto.value.modello} (${moto.value.cilindrata}cc, ${moto.value.cv} CV).`,
    })
  }
})
</script>

<style scoped>
/* HERO IMAGE */
.hero-img-wrap {
  margin-bottom: 40px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  max-height: 380px;
}
.hero-img {
  width: 100%;
  height: 380px;
  object-fit: cover;
  display: block;
}

/* BACK */
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

/* HEADER */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 48px;
}
.marca-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}
.modello-title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 900;
  line-height: 1;
}
.versione-label {
  color: var(--text-muted);
  font-weight: 600;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.anni { font-size: 15px; }

/* SECTION */
.section {
  margin-bottom: 48px;
}
.section-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

/* SPECS GRID */
.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.spec-item {
  padding: 20px;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.spec-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.spec-value {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
}
.spec-unit {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
}

/* CALC FORM */
.calc-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.form-group {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group-btn { max-width: 140px; }
.form-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* RESULT CARD */
.result-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
}
.result-total {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
}
.result-note {
  font-size: 12px;
  line-height: 1.5;
}

/* VIDEO */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.video-item {
  display: flex;
  gap: 16px;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  text-decoration: none;
}
.video-item:hover {
  border-color: var(--accent);
}
.video-thumb {
  width: 160px;
  height: 90px;
  object-fit: cover;
  border-radius: var(--radius);
  flex-shrink: 0;
  background: var(--bg-elevated);
}
.video-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
}
.video-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}
.video-channel { font-size: 13px; }

/* EMPTY */
.empty-state {
  text-align: center;
  padding: 80px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon { font-size: 48px; }

/* SKELETON */
.detail-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 640px) {
  .detail-header { flex-direction: column; }
  .form-row { flex-direction: column; }
  .form-group-btn { max-width: 100%; }
  .video-thumb { width: 100px; height: 56px; }
}
</style>

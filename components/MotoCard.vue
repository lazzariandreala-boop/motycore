<template>
  <NuxtLink :to="`/moto/${moto.id}`" class="moto-card card">

    <!-- Immagine: altezza fissa, nessun margin negativo -->
    <div class="card-img">
      <img v-if="moto.immagine_url" :src="moto.immagine_url" :alt="`${moto.marca} ${moto.modello}`" class="moto-thumb" />
      <div v-else class="moto-thumb-placeholder">{{ moto.marca[0] }}</div>
    </div>

    <!-- Testo in un wrapper separato col suo padding -->
    <div class="card-body">
      <div class="card-header">
        <div class="card-title">
          <div class="marca">{{ moto.marca }}</div>
          <div class="modello">{{ moto.modello }}<span v-if="moto.versione" class="versione"> {{ moto.versione }}</span></div>
        </div>
        <span v-if="moto.categoria" class="badge">{{ moto.categoria }}</span>
      </div>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">CV</span>
          <span class="stat-val text-accent">{{ moto.cv }}</span>
        </div>
        <div class="stat-sep"></div>
        <div class="stat-item">
          <span class="stat-label">kW</span>
          <span class="stat-val">{{ moto.kw }}</span>
        </div>
        <div class="stat-sep"></div>
        <div class="stat-item">
          <span class="stat-label">CC</span>
          <span class="stat-val">{{ moto.cilindrata }}</span>
        </div>
        <div class="stat-sep" v-if="moto.peso_kg"></div>
        <div class="stat-item" v-if="moto.peso_kg">
          <span class="stat-label">kg</span>
          <span class="stat-val">{{ moto.peso_kg }}</span>
        </div>
      </div>

      <div class="card-footer">
        <span class="anni text-muted">
          {{ moto.anno_inizio }}{{ moto.anno_fine ? ` – ${moto.anno_fine}` : ' →' }}
        </span>
        <span class="arrow text-accent">→</span>
      </div>
    </div>

    <!-- Confronta -->
    <button
      v-if="showConfronta"
      class="btn-confronta"
      :class="{ selected: isSelected }"
      @click.prevent="$emit('toggleConfronto', moto)"
    >
      {{ isSelected ? '✓ Selezionata' : '⊕ Confronta' }}
    </button>

  </NuxtLink>
</template>

<script setup lang="ts">
import type { Moto } from '~/composables/useMotyDb'

defineProps<{
  moto: Moto
  showConfronta?: boolean
  isSelected?: boolean
}>()

defineEmits<{ (e: 'toggleConfronto', m: Moto): void }>()
</script>

<style scoped>
/* ── Card container ─────────────────────────────── */
.moto-card {
  display: flex;
  flex-direction: column;
  padding: 0;              /* padding gestito per sezione */
  cursor: pointer;
  position: relative;
  overflow: hidden;
  height: 100%;            /* riempie la cella grid */
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.18s;
}
.moto-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-accent), var(--shadow);
  transform: translateY(-2px);
}
.moto-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;
}
.moto-card:hover::before { opacity: 1; }

/* ── Immagine: altezza fissa, non cresce mai ─────── */
.card-img {
  height: 180px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}
.moto-thumb {
  width: 100%;
  height: 100%;
  object-fit: contain;   /* moto sempre visibile intera */
  display: block;
  transition: transform 0.3s ease;
}
.moto-card:hover .moto-thumb { transform: scale(1.03); }
.moto-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 56px;
  font-weight: 900;
  color: var(--border);
}

/* ── Body testo ──────────────────────────────────── */
.card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.card-title { flex: 1; min-width: 0; }
.marca {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.modello {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 900;
  color: var(--text);
  margin-top: 2px;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.versione { color: var(--text-muted); font-weight: 600; }

/* Stats */
.stats-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}
.stat-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.stat-val {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
  margin-top: 1px;
}
.stat-sep {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
}

/* Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.anni { font-size: 12px; font-weight: 500; }
.arrow {
  font-size: 16px;
  font-weight: 900;
  transition: transform 0.2s;
}
.moto-card:hover .arrow { transform: translateX(4px); }

/* Confronta */
.btn-confronta {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-muted);
  transition: all 0.2s;
  display: none;
}
.moto-card:hover .btn-confronta { display: block; }
.btn-confronta.selected {
  display: block;
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-glow);
}
</style>

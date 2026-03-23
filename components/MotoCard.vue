<template>
  <NuxtLink :to="`/moto/${moto.id}`" class="moto-card card">
    <!-- Immagine -->
    <div class="card-img">
      <img v-if="moto.immagine_url" :src="moto.immagine_url" :alt="`${moto.marca} ${moto.modello}`" class="moto-thumb" />
      <div v-else class="moto-thumb-placeholder">{{ moto.marca[0] }}</div>
    </div>

    <!-- Header -->
    <div class="card-header">
      <div>
        <div class="marca">{{ moto.marca }}</div>
        <div class="modello">{{ moto.modello }}<span v-if="moto.versione" class="versione"> {{ moto.versione }}</span></div>
      </div>
      <span v-if="moto.categoria" class="badge">{{ moto.categoria }}</span>
    </div>

    <!-- Stats -->
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

    <!-- Footer -->
    <div class="card-footer">
      <span class="anni text-muted">
        {{ moto.anno_inizio }}{{ moto.anno_fine ? ` – ${moto.anno_fine}` : ' →' }}
      </span>
      <span class="arrow text-accent">→</span>
    </div>

    <!-- Confronta checkbox -->
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

const props = defineProps<{
  moto: Moto
  showConfronta?: boolean
  isSelected?: boolean
}>()

defineEmits<{ (e: 'toggleConfronto', m: Moto): void }>()
</script>

<style scoped>
.moto-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.18s;
}
.moto-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-accent), var(--shadow);
  transform: translateY(-2px);
}

/* Immagine */
.card-img {
  margin: -20px -20px 0;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--bg-elevated);
}
.moto-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.moto-card:hover .moto-thumb { transform: scale(1.04); }
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

/* Accent stripe top */
.moto-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.2s;
}
.moto-card:hover::before { opacity: 1; }

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.marca {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.modello {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 900;
  color: var(--text);
  margin-top: 2px;
  line-height: 1.1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.versione {
  color: var(--text-muted);
  font-weight: 600;
}

/* Stats */
.stats-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
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
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-faint);
}
.stat-val {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 900;
  line-height: 1.1;
  margin-top: 2px;
}
.stat-sep {
  width: 1px;
  height: 32px;
  background: var(--border);
  flex-shrink: 0;
}

/* Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.anni {
  font-size: 13px;
  font-weight: 500;
}
.arrow {
  font-size: 18px;
  font-weight: 900;
  transition: transform 0.2s;
}
.moto-card:hover .arrow { transform: translateX(4px); }

/* Confronta btn */
.btn-confronta {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 5px 12px;
  border-radius: 4px;
  font-family: var(--font-display);
  font-size: 12px;
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

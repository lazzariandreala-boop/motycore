# MotyCore 🏍️

App web per motociclisti — schede tecniche, confronto, calcolo bollo e stima assicurazione.

## Stack

- **Frontend**: Nuxt 3 + Vue 3 + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS custom (no framework UI)

---

## Setup in 5 minuti

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Configura le variabili d'ambiente

```bash
cp .env.example .env
```

Poi apri `.env` e compila:

| Variabile | Dove trovarla |
|---|---|
| `SUPABASE_URL` | Già compilata (progetto MotyCore) |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → **anon public** |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → **service_role** (opzionale) |
| `YOUTUBE_API_KEY` | [console.cloud.google.com](https://console.cloud.google.com) → YouTube Data API v3 |

### 3. Crea la tabella sul DB

Vai su **Supabase → SQL Editor → New Query** e incolla il contenuto di `insert_moto.sql` (file separato).

Prima crea la tabella:

```sql
CREATE TABLE moto (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  marca       text NOT NULL,
  modello     text NOT NULL,
  versione    text,
  anno_inizio int NOT NULL,
  anno_fine   int,
  cilindrata  int NOT NULL,
  cv          int NOT NULL,
  kw          int GENERATED ALWAYS AS (round(cv * 0.7355)) STORED,
  categoria   text,
  peso_kg     int,
  created_at  timestamptz DEFAULT now()
);
```

Poi esegui l'INSERT con le 107 moto.

### 4. Avvia in locale

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

---

## Struttura progetto

```
motycore/
├── assets/css/main.css        ← Design system (variabili CSS, utility)
├── components/
│   └── MotoCard.vue           ← Card moto per la griglia
├── composables/
│   ├── useMotyDb.ts           ← Query Supabase (getMoto, getMotoById, ecc.)
│   └── useCalcoli.ts          ← Calcoli bollo, assicurazione, tagliandi
├── pages/
│   ├── index.vue              ← Catalogo con filtri e ricerca
│   ├── moto/[id].vue          ← Scheda dettaglio moto
│   └── confronta.vue          ← Confronto side-by-side fino a 3 moto
├── app.vue                    ← Layout globale (navbar + footer)
├── nuxt.config.ts             ← Config Nuxt + Supabase
└── .env.example               ← Template variabili d'ambiente
```

## Calcolo bollo

Formula ufficiale ACI:
- `€2.58/kW` per i primi 100 kW
- `€3.87/kW` per i kW oltre i 100
- Maggiorazione regionale (0% – 10% a seconda della regione)
- Sconto anzianità: -30% dopo 5 anni, -50% dopo 10 anni

## Roadmap

- [ ] Aggiunta moto manuale dal frontend (per admin)
- [ ] Officine vicino a te (Google Places API)
- [ ] Filtro A2 (≤ 35 kW, ≤ 0.2 kW/kg)
- [ ] Confronto assicurazioni con affiliate link
- [ ] App mobile (Capacitor)


andare su nomesito/admin/immagini
per effettuare l'aggiornamento delle immagini delle motociclette
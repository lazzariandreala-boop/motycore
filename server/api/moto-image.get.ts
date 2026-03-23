// server/api/moto-image.get.ts
// Tutta la logica di ricerca immagini è server-side:
// 1) moto.it  2) inSella.it  3) Wikipedia REST API  4) Wikimedia Commons
// Il browser fa UNA sola richiesta a /api/moto-image, zero errori in console.

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
const BOT_UA     = 'MotyCore/1.0 (contact@motycore.it)'

// Slug con trattini tra lettera↔cifra: F900XR → f-900-xr  (moto.it standard)
function toSlug(s: string): string {
  return s.toLowerCase().trim()
    .replace(/([a-z])(\d)/g, '$1-$2')
    .replace(/(\d)([a-z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Slug semplice senza trattini tra lettera↔cifra: V4 → v4, MT09 → mt09
function toSlugSimple(s: string): string {
  return s.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function ogImage(html: string): string | null {
  return (
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/)?.[1] ??
    null
  )
}

// ── filtro immagine ────────────────────────────────────────────────────────────
// Scarta URL che sembrano non essere foto di moto (loghi, persone, veicoli commerciali)
function isGoodImg(url: string): boolean {
  if (!url) return false
  const u = url.toLowerCase()
  if (/logo|placeholder|default|brand|favicon|icon/i.test(u)) return false
  if (/\b(truck|lorry|camion|bus|furgone|pickup|van)\b/i.test(u)) return false
  return true
}

// ── helper moto.it ────────────────────────────────────────────────────────────
async function provaMotoIt(url: string, stem: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'it-IT' } })
    if (!res.ok) return null
    if (!res.url.includes(stem)) return null
    const img = ogImage(await res.text())
    if (img && isGoodImg(img)) return img
  } catch {}
  return null
}

// ── 1. moto.it ────────────────────────────────────────────────────────────────
async function daMotoIt(marca: string, modello: string, cilindrata = '', anno = ''): Promise<string | null> {
  const ms  = toSlug(marca)
  const cc  = cilindrata ? String(Math.round(Number(cilindrata) / 50) * 50) : ''

  // Slug del modello: versione con trattini lettera↔cifra e versione semplice
  const ds       = toSlug(modello)        // "Dorsoduro 900" → "dorsoduro-900"
  const dsSimple = toSlugSimple(modello)  // "Dorsoduro 900" → "dorsoduro-900" (uguale)
  // Base senza suffisso numerico:        "dorsoduro-900" → "dorsoduro"
  const dsBase   = ds.replace(/-\d{3,4}$/, '')
  const dsBaseS  = dsSimple.replace(/-\d{3,4}$/, '')

  // ── Fase 1: slug esatti (con e senza CC esplicita) ─────────────────────────
  // Costruisce la lista deduplicata di slug da provare
  const exact: string[] = [...new Set([ds, dsSimple])]
  // Aggiunge variante +CC solo se lo slug non la contiene già
  if (cc) {
    for (const s of [...exact]) {
      if (!s.endsWith(`-${cc}`)) exact.push(`${s}-${cc}`)
    }
  }
  // Aggiunge anche la base pura (dorsoduro) → moto.it potrebbe redirectare alla CC più recente
  for (const b of [dsBase, dsBaseS]) {
    if (!exact.includes(b)) exact.push(b)
  }

  for (const slug of exact) {
    const stem = slug.replace(/-\d{3,4}$/, '') || slug
    const img =
      (await provaMotoIt(`https://www.moto.it/listino/${ms}/${slug}/`,      stem)) ??
      (await provaMotoIt(`https://www.moto.it/listino/${ms}/${slug}-abs/`,  stem))
    if (img) return img
  }

  // ── Fase 2: brand page ─────────────────────────────────────────────────────
  // Scarica la pagina del marchio e cerca link che iniziano con la base del modello
  try {
    const brandRes = await fetch(`https://www.moto.it/listino/${ms}/`, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'it-IT' },
    })
    if (brandRes.ok) {
      const html  = await brandRes.text()
      const hrefs = [...html.matchAll(/href="(\/listino\/[^/"]+\/([^/"]+)\/?)"/g)]
      for (const base of [dsBase, dsBaseS]) {
        for (const [, href, part] of hrefs) {
          if (!part.startsWith(base)) continue
          const img = await provaMotoIt(`https://www.moto.it${href}`, base)
          if (img) return img
        }
      }
    }
  } catch {}

  // ── Fase 3: cilindrate simili ───────────────────────────────────────────────
  // Dorsoduro 900 non esiste → prova dorsoduro-750, dorsoduro-800, ecc.
  const CILINDRATE = [125, 250, 300, 400, 500, 600, 650, 700, 750, 800, 900, 1000, 1100, 1200, 1250]
  const ccNum = Number(cc) || 0
  const altreCC = CILINDRATE
    .filter(c => c !== ccNum)
    .sort((a, b) => Math.abs(a - ccNum) - Math.abs(b - ccNum))
    .slice(0, 8)

  for (const c of altreCC) {
    for (const base of [...new Set([dsBase, dsBaseS])]) {
      const img = await provaMotoIt(`https://www.moto.it/listino/${ms}/${base}-${c}/`, base)
      if (img) return img
    }
  }

  // ── Fase 4: solo parola base (senza numeri) ─────────────────────────────────
  // "atlantic-500" → "atlantic", "f-650-gs" → "f-gs" (troppo corto, skip se < 4 car.)
  const wordOnly = dsBase.replace(/-?\d+-?/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (wordOnly.length >= 4 && wordOnly !== dsBase) {
    const img = await provaMotoIt(`https://www.moto.it/listino/${ms}/${wordOnly}/`, wordOnly)
    if (img) return img
  }

  return null
}

// ── 2. Wikipedia REST API ─────────────────────────────────────────────────────
const NON_MOTO = /\b(truck|lorry|camion|bus|aircraft|airplane|ship|boat|automobile|tractor|politician|musician|actor|actress|singer|company|corporation|building)\b/i
const MOTO_KEYWORDS = /\b(motorcycle|motorbike|moto|scooter|naked|enduro|touring|trail|cruiser|motocicletta|\d+\s*cc|\d+\s*cv|two.wheel|bicilindri|monocilindri)\b/i

async function daWikipedia(marca: string, modello: string): Promise<string | null> {
  const titoli = [`${marca} ${modello}`, modello, `${marca} ${modello} motorcycle`]
  const lingue = ['en', 'it']

  for (const lang of lingue) {
    for (const t of titoli) {
      try {
        const slug = encodeURIComponent(t.replace(/\s+/g, '_'))
        const res  = await fetch(
          `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`,
          { headers: { 'User-Agent': BOT_UA } }
        )
        if (!res.ok) continue
        const data = await res.json()
        if (data.type !== 'standard') continue
        const desc = `${data.description || ''} ${data.extract?.slice(0, 300) || ''}`
        if (NON_MOTO.test(desc)) continue
        // Richiede almeno un keyword moto nella descrizione
        if (!MOTO_KEYWORDS.test(desc)) continue
        const thumb = data.thumbnail
        if (!thumb?.source || !isGoodImg(thumb.source)) continue
        // Rifiuta immagini ritratto (persone) — le moto sono sempre landscape
        if (thumb.width && thumb.height && thumb.width < thumb.height * 1.1) continue
        return thumb.source
      } catch {}
    }
  }
  return null
}

// ── 3. inSella.it ─────────────────────────────────────────────────────────────
// Rivista italiana dedicata esclusivamente alle moto → og:image sempre una moto
async function daInSella(marca: string, modello: string): Promise<string | null> {
  try {
    const q   = encodeURIComponent(`${marca} ${modello}`)
    const res = await fetch(`https://www.insella.it/?s=${q}`, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'it-IT' },
    })
    if (!res.ok) return null
    const html = await res.text()

    // Estrae link agli articoli (URL interni, senza query string, senza categorie/tag)
    const links = [...new Set(
      [...html.matchAll(/href="(https:\/\/www\.insella\.it\/[^"#?]+)"/g)]
        .map(m => m[1])
        .filter(u => u.split('/').filter(Boolean).length >= 4) // almeno /sezione/anno/mese/titolo
    )]

    for (const link of links.slice(0, 4)) {
      try {
        const art = await fetch(link, { headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'it-IT' } })
        if (!art.ok) continue
        const img = ogImage(await art.text())
        if (img && isGoodImg(img)) return img
      } catch {}
    }
  } catch {}
  return null
}

// ── 4. Wikimedia Commons ──────────────────────────────────────────────────────
const BAD_FILE = /\b(truck|lorry|camion|bus|furgone|woman|man|girl|boy|person|people|show|expo|fair|salon|portrait|riding|rider|stand|booth)\b/i

async function daCommons(marca: string, modello: string): Promise<string | null> {
  try {
    const q   = encodeURIComponent(`intitle:${marca} intitle:${modello}`)
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|dimensions&iiurlwidth=700&format=json`
    const res  = await fetch(url, { headers: { 'User-Agent': BOT_UA } })
    if (!res.ok) return null
    const data  = await res.json()
    const pages = Object.values(data?.query?.pages ?? {}) as any[]
    const jpeg = pages.find(p => {
      const info = p.imageinfo?.[0]
      if (info?.mime !== 'image/jpeg') return false
      const title = (p.title || '').toLowerCase()
      if (BAD_FILE.test(title)) return false
      const imgUrl = info.thumburl ?? info.url
      if (!isGoodImg(imgUrl)) return false
      // Rifiuta immagini ritratto — le moto sono sempre landscape
      if (info.width && info.height && info.width < info.height * 1.1) return false
      return true
    })
    return jpeg?.imageinfo?.[0]?.thumburl ?? jpeg?.imageinfo?.[0]?.url ?? null
  } catch {
    return null
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default defineEventHandler(async (event) => {
  const { marca = '', modello = '', anno = '', cilindrata = '' } = getQuery(event) as Record<string, string>
  if (!marca || !modello) return { url: null }

  const url =
    (await daMotoIt(marca, modello, cilindrata, anno)) ??   // 1. moto.it (foto ufficiali)
    (await daInSella(marca, modello))                  ??   // 2. inSella.it (rivista moto IT)
    (await daWikipedia(marca, modello))                ??   // 3. Wikipedia
    (await daCommons(marca, modello))                       // 4. Wikimedia Commons

  return { url: url ?? null }
})

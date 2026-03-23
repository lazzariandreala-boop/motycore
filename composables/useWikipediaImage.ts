// composables/useWikipediaImage.ts
// Priorità: 1) Google Custom Search  2) Wikipedia infobox  3) Wikimedia Commons
// Anno incluso nella query per evitare modelli sbagliati.

const WIKI_API    = 'https://en.wikipedia.org/w/api.php'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'

const DETAIL_KW = [
  'detail','close','closeup','close-up',
  'wheel','tire','tyre','fork','suspension',
  'engine','motor','cylinder','exhaust','pipe','muffler',
  'brake','disc','disk','caliper',
  'headlight','taillight','headlamp',
  'handlebar','cockpit','dash','instrument','gauge',
  'logo','badge','emblem','frame','chassis',
]

function isDettaglio(title: string): boolean {
  const t = title.toLowerCase()
  return DETAIL_KW.some(kw => t.includes(kw))
}

function scoreAngolo(title: string): number {
  const t = title.toLowerCase()
  let s = 0
  if (t.includes('front') || t.includes('three-quarter')) s += 3
  if (t.includes('side')  || t.includes('profile'))      s += 2
  if (t.includes('studio'))                              s += 1
  if (t.includes('rear')  || t.includes('back'))        s -= 4
  return s
}

// ── 1. Google Custom Search ───────────────────────────────────────────────────
async function daGoogle(marca: string, modello: string, anno: number, apiKey: string, cx: string): Promise<string | null> {
  const q   = encodeURIComponent(`${marca} ${modello} ${anno}`)
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&searchType=image&imgType=photo&imgSize=large&num=5&q=${q}`

  const res  = await fetch(url)
  const data = await res.json()
  return data?.items?.[0]?.link ?? null
}

// ── 2. Wikipedia — pageimage dell'articolo specifico ─────────────────────────
async function daWikipedia(marca: string, modello: string, anno: number): Promise<string | null> {
  const q   = encodeURIComponent(`${marca} ${modello} ${anno}`)
  const url = `${WIKI_API}?action=query&generator=search&gsrsearch=${q}&gsrlimit=3&prop=pageimages&format=json&pithumbsize=700&origin=*`

  const res   = await fetch(url)
  const data  = await res.json()
  const pages = Object.values(data?.query?.pages ?? {}) as any[]

  const marcaL   = marca.toLowerCase()
  const modelloL = modello.toLowerCase().split(' ')[0]

  const match = pages.find(p => {
    const title = (p.title ?? '').toLowerCase()
    return title.includes(marcaL) && title.includes(modelloL) && p.thumbnail?.source
  })
  return match?.thumbnail?.source ?? null
}

// ── 3. Wikimedia Commons — intitle search ────────────────────────────────────
async function daCommons(marca: string, modello: string): Promise<string | null> {
  const q   = encodeURIComponent(`intitle:${marca} intitle:${modello}`)
  const url = `${COMMONS_API}?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=25&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=700&format=json&origin=*`

  const res   = await fetch(url)
  const data  = await res.json()
  const pages = Object.values(data?.query?.pages ?? {}) as any[]

  const candidati = pages
    .filter(p => p.imageinfo?.[0]?.mime === 'image/jpeg')
    .filter(p => {
      const info = p.imageinfo?.[0]
      return info?.width >= 500 && info.width > info.height * 1.4
    })
    .filter(p => !isDettaglio(p.title ?? ''))

  if (!candidati.length) return null
  candidati.sort((a, b) => scoreAngolo(b.title) - scoreAngolo(a.title))

  const hit = candidati[0]
  return hit?.imageinfo?.[0]?.thumburl ?? hit?.imageinfo?.[0]?.url ?? null
}

// ── Entry point ───────────────────────────────────────────────────────────────
export interface ImmagineOpts {
  googleCseKey?: string
  googleCseCx?:  string
}

export async function cercaImmagineWikipedia(
  marca: string,
  modello: string,
  anno: number,
  opts: ImmagineOpts = {}
): Promise<string | null> {
  if (opts.googleCseKey && opts.googleCseCx) {
    const url = await daGoogle(marca, modello, anno, opts.googleCseKey, opts.googleCseCx)
    if (url) return url
  }
  return (await daWikipedia(marca, modello, anno)) ?? (await daCommons(marca, modello))
}

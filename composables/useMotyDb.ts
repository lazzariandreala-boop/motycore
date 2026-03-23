// composables/useMotyDb.ts
// Wrapper tipizzato per tutte le query Supabase relative alle moto

export interface Moto {
  id: number
  marca: string
  modello: string
  versione: string | null
  anno_inizio: number
  anno_fine: number | null
  cilindrata: number
  cv: number
  kw: number
  categoria: string | null
  peso_kg: number | null
  immagine_url: string | null
  created_at: string
}

export interface FiltriMoto {
  marca?: string
  categoria?: string
  cvMin?: number
  cvMax?: number
  ccMin?: number
  ccMax?: number
  cerca?: string
}

export function useMotyDb() {
  const supabase = useSupabaseClient()

  /**
   * Lista moto con filtri opzionali + paginazione
   */
  async function getMoto(filtri: FiltriMoto = {}, page = 0, perPage = 24) {
    let query = supabase
      .from('moto')
      .select('*', { count: 'exact' })
      .order('marca', { ascending: true })
      .order('modello', { ascending: true })
      .range(page * perPage, (page + 1) * perPage - 1)

    if (filtri.marca)    query = query.eq('marca', filtri.marca)
    if (filtri.categoria) query = query.eq('categoria', filtri.categoria)
    if (filtri.cvMin)    query = query.gte('cv', filtri.cvMin)
    if (filtri.cvMax)    query = query.lte('cv', filtri.cvMax)
    if (filtri.ccMin)    query = query.gte('cilindrata', filtri.ccMin)
    if (filtri.ccMax)    query = query.lte('cilindrata', filtri.ccMax)
    if (filtri.cerca)    query = query.or(
      `marca.ilike.%${filtri.cerca}%,modello.ilike.%${filtri.cerca}%`
    )

    const { data, error, count } = await query
    if (error) throw error
    return { moto: data as Moto[], total: count ?? 0 }
  }

  /**
   * Singola moto per ID
   */
  async function getMotoById(id: number | string) {
    const { data, error } = await supabase
      .from('moto')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Moto
  }

  /**
   * Lista marche distinte (per filtro select)
   */
  async function getMarche() {
    const { data, error } = await supabase
      .from('moto')
      .select('marca')
      .order('marca')
    if (error) throw error
    return [...new Set((data as { marca: string }[]).map(r => r.marca))]
  }

  /**
   * Lista categorie distinte (per filtro select)
   */
  async function getCategorie() {
    const { data, error } = await supabase
      .from('moto')
      .select('categoria')
      .not('categoria', 'is', null)
      .order('categoria')
    if (error) throw error
    return [...new Set((data as { categoria: string }[]).map(r => r.categoria))]
  }

  /**
   * Moto multipla per confronto (max 3 id)
   */
  async function getMotoConfronto(ids: number[]) {
    if (!ids.length) return []
    const { data, error } = await supabase
      .from('moto')
      .select('*')
      .in('id', ids)
    if (error) throw error
    return data as Moto[]
  }

  /**
   * Tutte le moto senza paginazione (per batch admin)
   */
  async function getTutteLeMoto() {
    const { data, error } = await supabase
      .from('moto')
      .select('*')
      .order('marca', { ascending: true })
      .order('modello', { ascending: true })
    if (error) throw error
    return data as Moto[]
  }

  /**
   * Aggiorna l'URL immagine di una moto
   */
  async function updateImmagineUrl(id: number, url: string | null) {
    const { error } = await supabase
      .from('moto')
      .update({ immagine_url: url })
      .eq('id', id)
    if (error) throw error
  }

  return { getMoto, getMotoById, getMarche, getCategorie, getMotoConfronto, getTutteLeMoto, updateImmagineUrl }
}

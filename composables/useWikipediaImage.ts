// composables/useWikipediaImage.ts
// Il browser chiama SOLO /api/moto-image (server Nuxt).
// Tutta la logica moto.it → Wikipedia → Commons è gestita server-side.
// Zero 404 / 429 visibili in console.

export interface ImmagineOpts {}

async function cercaImmagineWikipedia(
  marca: string,
  modello: string,
  anno: number,
  _opts: ImmagineOpts = {},
  cilindrata?: number
): Promise<string | null> {
  try {
    const data = await $fetch<{ url: string | null }>('/api/moto-image', {
      params: { marca, modello, anno: String(anno), cilindrata: cilindrata ? String(cilindrata) : '' },
    })
    return data?.url ?? null
  } catch {
    return null
  }
}

export function useWikipediaImage() {
  return { cerca: cercaImmagineWikipedia }
}

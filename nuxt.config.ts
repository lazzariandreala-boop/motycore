// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },

  modules: ['@nuxtjs/supabase'],

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    redirect: false, // disabilitiamo redirect automatico auth (non usiamo auth ora)
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Chiavi private (solo server)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    // Chiavi pubbliche (anche client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      youtubeApiKey: process.env.YOUTUBE_API_KEY,
      googleCseKey: process.env.GOOGLE_CSE_KEY,
      googleCseCx:  process.env.GOOGLE_CSE_CX,
    },
  },

  app: {
    head: {
      title: 'MotyCore — Il mondo delle moto in un\'app',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Schede tecniche, confronto moto, calcolo bollo e assicurazione. Tutte le moto in un unico posto.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap' },
      ],
    },
  },

  compatibilityDate: '2024-11-01',
})

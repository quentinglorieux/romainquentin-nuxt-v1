// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui', '@nuxt/content', '@vueuse/nuxt', 'nuxt-og-image', 'motion-v/nuxt', 'nuxt-studio'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Roboto:wght@400;500&family=Roboto+Slab:wght@400;600&display=swap",
        },
      ],
    },
  },

  fonts: {
    providers: {
      bunny: false,
    },
  },
  compatibilityDate: '2024-11-01',

  nitro: {
    prerender: {
      routes: [
        '/'
      ],
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },
    devServer: {
    port: 4444,
  },
    runtimeConfig: {
    public: {
      openalexAuthorId: 'https://openalex.org/A5035809054', // ⚠️ "A" majuscule
      openalexBase: 'https://api.openalex.org',
      openalexPerPage: 100,
      openalexMailto: 'quentin.glorieux@lkb.upmc.fr'        // pour mailto et UA
    }
  },
  routeRules: {
    '/api/openalex/**': { cache: { maxAge: 60 } },
  },
  studio: {
    // Studio admin route (default: '/_studio')
    route: '/studio',
    
    // GitHub repository configuration (owner and repo are required)
    repository: {
      provider: 'github', // only GitHub is currently supported
      owner: 'quentinglorieux', // your GitHub username or organization
      repo: 'romainquentin-nuxt-v1', // your repository name
      branch: 'main', // the branch to commit to (default: main)
      rootDir: '' // optional: if your Nuxt app is in a subdirectory (default: '')
    },

  }
})
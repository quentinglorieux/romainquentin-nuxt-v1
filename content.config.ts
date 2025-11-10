// content.config.js
import { defineContentConfig, defineCollection } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    // Singletons
    admin: defineCollection({
      type: 'data',
      source: 'admin.{yml,yaml,json}',
      schema: z.any()
    }),
    home: defineCollection({
      type: 'data',
      source: 'home.{yml,yaml,json}',
      schema: z.any()
    }),

    // Markdown collections
    members: defineCollection({
      type: 'page',
      source: 'members/**/*.md',
      schema: z.object({
        rank: z.number().optional(),         
        role: z.string().optional(),
        image: z.string().optional(),
        links: z.record(z.string()).optional()
      })
    }),
    jobs:    defineCollection({ type: 'page', source: 'jobs/**/*.md' }),
    news: defineCollection({
      type: 'page',
      source: 'news/**/*.md',
      schema: z.object({
        date: z.string(),                // ISO string "2025-03-01"
        category: z.string().optional(), // Publication | Grant | Talk | …
        cover: z.string().optional(),    // image URL
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        external: z.object({
          url: z.string(),
          label: z.string().optional()
        }).optional()
      })
    }),
    research:defineCollection({ type: 'page', source: 'research/**/*.md' }),

    // YAML publications
    publications: defineCollection({
      type: 'data',
      source: 'publications/**/*.{yml,yaml}',
      schema: z.any()
    })
  }
})
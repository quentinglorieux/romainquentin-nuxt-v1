// content.config.js
import { defineContentConfig, defineCollection, property } from '@nuxt/content'
import { z } from 'zod'

const media = <T extends z.ZodTypeAny>(schema: T) => property(schema).editor({ input: 'media' })

const linkSchema = z.object({
  label: z.string().optional(),
  to: z.string()
}).passthrough()

const navItemSchema = z.object({
  label: z.string().min(1),
  to: z.string().min(1)
}).passthrough()

const footerColumnSchema = z.object({
  title: z.string().optional(),
  lines: z.array(z.string()).default([]),
  link: linkSchema.optional()
}).passthrough()

const adminSchema = z.object({
  lab: z.object({
    logo: media(z.string()).optional(),
    name: z.string().min(1)
  }).passthrough(),
  header: z.object({
    nav: z.array(navItemSchema).default([])
  }).passthrough(),
  footer: z.object({
    text: z.string().optional(),
    left: footerColumnSchema.optional(),
    right: footerColumnSchema.optional()
  }).passthrough().optional()
}).passthrough()

const homeSchema = z.object({
  hero: z.object({
    bg: z.string().optional(),
    image: media(z.string()).optional(),
    imageAlt: z.string().optional(),
    pretitle: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    buttons: z.array(navItemSchema).default([])
  }).passthrough()
}).passthrough()

const memberLinksSchema = z.object({
  orcid: z.string().optional(),
  scholar: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional()
}).passthrough()

function coerceMemberLinks(value: unknown) {
  // Accept the previous array-of-objects format and convert it to an object
  if (Array.isArray(value)) {
    const out: Record<string, string> = {}
    for (const item of value) {
      if (!item || typeof item !== 'object') continue
      const anyItem = item as Record<string, unknown>
      const key = String(anyItem.type ?? anyItem.key ?? '').trim()
      const url = String(anyItem.url ?? anyItem.to ?? '').trim()
      if (!key || !url) continue
      out[key] = url
    }
    return out
  }
  return value
}

export default defineContentConfig({
  collections: {
    // Singletons
    admin: defineCollection({
      type: 'data',
      source: 'admin.{yml,yaml,json}',
      schema: adminSchema
    }),
    home: defineCollection({
      type: 'data',
      source: 'home.{yml,yaml,json}',
      schema: homeSchema
    }),
    test: defineCollection({
      type: 'data',
      source: 'test.{yml,yaml,json}',
      schema: z.any()
    }),

    // Markdown collections
    members: defineCollection({
      type: 'page',
      source: 'members/**/*.md',
      schema: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        rank: z.number().optional(),
        role: z.string().optional(),
        cv: z.string().optional(),
        image: media(z.string()).optional(),
        links: z.preprocess(coerceMemberLinks, memberLinksSchema).default({}),
        seo: z.object({
          title: z.string().optional(),
          description: z.string().optional()
        }).passthrough().optional()
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
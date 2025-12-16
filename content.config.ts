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

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional()
}).passthrough()

const stringListSchema = z.array(z.string()).default([])

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
        seo: seoSchema.optional()
      })
    }),
    jobs: defineCollection({
      type: 'page',
      source: 'jobs/**/*.md',
      schema: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        deadline: z.string().optional(),
        contract: z.string().optional(),
        team: z.string().optional(),
        lab: z.string().optional(),
        start: z.string().optional(),
        duration: z.string().optional(),
        salary: z.string().optional(),
        keywords: stringListSchema.optional(),
        contact_name: z.string().optional(),
        contact_email: z.string().optional(),
        application_url: z.string().optional(),
        pdf: media(z.string()).optional(),
        seo: seoSchema.optional()
      }).passthrough()
    }),
    news: defineCollection({
      type: 'page',
      source: 'news/**/*.md',
      schema: z.object({
        title: z.string().optional(),
        date: z.string().optional(), // ISO string "2025-03-01"
        category: z.string().optional(),
        description: z.string().optional(),
        cover: media(z.string()).optional(),
        tags: stringListSchema.optional(),
        publications: stringListSchema.optional(),
        members: stringListSchema.optional(),
        external: z.object({
          url: z.string(),
          label: z.string().optional()
        }).passthrough().optional(),
        seo: seoSchema.optional()
      }).passthrough()
    }),
    research: defineCollection({
      type: 'page',
      source: 'research/**/*.md',
      schema: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        image: media(z.string()).optional(),
        tags: stringListSchema.optional(),
        publications: stringListSchema.optional(),
        members: stringListSchema.optional(),
        seo: seoSchema.optional()
      }).passthrough()
    }),

    // YAML publications
    publications: defineCollection({
      type: 'data',
      source: 'publications/**/*.{yml,yaml}',
      schema: z.any()
    })
  }
})
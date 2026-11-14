import { defineCollection, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

const schema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    // drafts show in `npm run dev` but are left out of the built site
    draft: z.boolean().default(false),
  });

// Vietnamese posts: src/content/blog/xin-chao.md → /blog/xin-chao
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema,
});

// English translations: same file name in src/content/en/ → /en/blog/xin-chao
const blogEn = defineCollection({
  loader: glob({ base: './src/content/en', pattern: '**/*.{md,mdx}' }),
  schema,
});

export const collections = { blog, blogEn };

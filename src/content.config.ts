import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Each post is a Markdown file in src/content/blog/. The file name becomes the URL: xin-chao.md → /blog/xin-chao
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
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
    }),
});

export const collections = { blog };

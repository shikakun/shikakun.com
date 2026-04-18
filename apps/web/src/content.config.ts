import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
});

export const collections = { pages };

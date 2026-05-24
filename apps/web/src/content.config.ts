import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    displayDate: z.string().optional(),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    tags: z
      .array(
        z
          .string()
          .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            'tag must be a kebab-case slug (lowercase letters, digits, and single hyphens only)',
          ),
      )
      .optional(),
    unlisted: z.boolean().optional(),
  }),
});

const tags = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/tags' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

export const collections = { pages, tags };

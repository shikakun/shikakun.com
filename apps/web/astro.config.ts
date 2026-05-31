import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import rehypeBudoux from 'rehype-budoux';

export default defineConfig({
  output: 'static',
  markdown: {
    processor: unified({
      // biome-ignore lint: rehype-budouxの型がPlugin<[Options?], Parent>のためRoot型と合わない
      rehypePlugins: [rehypeBudoux as any],
    }),
  },
  integrations: [mdx(), react()],
});

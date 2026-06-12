import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import rehypeBudoux from 'rehype-budoux';
import remarkBreaks from 'remark-breaks';

export default defineConfig({
  output: 'static',
  markdown: {
    processor: unified({
      remarkPlugins: [remarkBreaks],
      // biome-ignore lint: rehype-budouxの型がPlugin<[Options?], Parent>のためRoot型と合わない
      rehypePlugins: [rehypeBudoux as any],
      // 日本語中心のサイトでは英文タイポグラフィ変換の恩恵がなく、角括弧構文の引数の引用符を壊すため無効化
      smartypants: false,
    }),
  },
  integrations: [mdx(), react()],
});

import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeBudoux from 'rehype-budoux';
import remarkBreaks from 'remark-breaks';
import { rehypeExternalLinks } from './src/lib/rehype-external-links/index';
import { remarkBracketSyntax } from './src/lib/remark-bracket-syntax/index';

export default defineConfig({
  output: 'static',
  site: 'https://shikakun.com',
  markdown: {
    processor: unified({
      // 角括弧構文は、remark-breaksがtextノードを改行で分割する前に処理する
      remarkPlugins: [remarkBracketSyntax, remarkBreaks],
      // biome-ignore lint: rehype-budouxの型がPlugin<[Options?], Parent>のためRoot型と合わない
      rehypePlugins: [rehypeBudoux as any, rehypeExternalLinks],
      // 日本語中心のサイトでは英文タイポグラフィ変換の恩恵がなく、角括弧構文の引数の引用符を壊すため無効化
      smartypants: false,
    }),
  },
  integrations: [mdx(), react(), sitemap()],
});

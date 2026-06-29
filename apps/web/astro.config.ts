import cloudflare from '@astrojs/cloudflare';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';
import rehypeBudoux from 'rehype-budoux';
import remarkBreaks from 'remark-breaks';
import { feedIntegration } from './scripts/feed-integration.mjs';
import { contentWatchIntegration } from './scripts/sync-content.mjs';
import { SITE_DESCRIPTION, SITE_TITLE } from './src/consts';
import { rehypeExternalLinks } from './src/lib/rehype-external-links/index';
import { remarkBracketSyntax } from './src/lib/remark-bracket-syntax/index';

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  site: 'https://shikakun.com',
  markdown: {
    processor: unified({
      // 角括弧構文は、remark-breaksがtextノードを改行で分割する前に処理する
      remarkPlugins: [remarkBracketSyntax, remarkBreaks],
      // biome-ignore lint: rehype-budouxの型がPlugin<[Options?], Parent>のためRoot型と合わない
      rehypePlugins: [rehypeBudoux as any, rehypeExternalLinks],
      // 日本語中心のサイトでは英文タイポグラフィ変換の恩恵がなく、角括弧構文の引数の引用符を壊すため無効化
      smartypants: false,
      // GFMの脚注のラベルを日本語にする
      remarkRehype: {
        footnoteLabel: '脚注',
        footnoteBackLabel: (referenceIndex: number, rereferenceIndex: number) =>
          `参照${referenceIndex + 1}${rereferenceIndex > 1 ? `の${rereferenceIndex}` : ''}に戻る`,
        // ↩（U+21A9）は環境により絵文字表示になるため、異体字セレクタ U+FE0E でテキスト表示に固定する
        footnoteBackContent: '↩\uFE0E',
      },
    }),
  },
  integrations: [
    mdx(),
    react(),
    sitemap(),
    contentWatchIntegration(),
    feedIntegration({ title: SITE_TITLE, description: SITE_DESCRIPTION }),
  ],
  env: {
    schema: {
      MESSAGE_FORM_API_URL: envField.string({ context: 'server', access: 'secret' }),
      MESSAGE_FORM_API_TOKEN: envField.string({ context: 'server', access: 'secret' }),
    },
  },
  vite: {
    // 開発サーバーの初回アクセス時にReactが「Invalid hook call」で壊れる不具合（ページをリロードすると直る）への対処。
    //
    // Viteは依存パッケージを事前にまとめて最適化してから配信する。
    // 通常は起動時にまとめて最適化するが、astro/zodは最初のページを描画している最中に初めて読み込まれるため、その途中で最適化がやり直しになり、サーバーが再読み込みされる。
    // このとき、ページを描画するreact-dom/serverと、各コンポーネントが参照するReactが、それぞれ最適化前後の別々のReactを掴んでしまう。
    // Reactは同一のインスタンスを共有していないとuseRefなどのフックが動かないため、エラーになる。
    //
    // そこで、最初の描画より前にこれらを最適化対象として明示し、描画中の最適化のやり直しが起きないようにする。
    optimizeDeps: {
      include: ['astro/zod', 'react', 'react-dom', 'react-dom/server', 'react/jsx-runtime'],
    },
    // 念のため、参照されるReactの実体を常に1つに統一する
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  },
});

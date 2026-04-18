import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  integrations: [mdx()],
});

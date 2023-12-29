import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import compress from "astro-compress";

export default defineConfig({
  integrations: [react(), compress()],
  site: 'https://shikakun.com',
  trailingSlash: 'always',
  markdown: {
    shikiConfig: {
      // https://github.com/shikijs/shiki/blob/main/docs/themes.md
      theme: 'nord',
      // https://github.com/shikijs/shiki/blob/main/docs/languages.md
      langs: [],
      wrap: true,
    },
  },
  redirects: {
    '/articles/banana-bread-padding/': '/projects/banana-bread-padding/',
    '/articles/benri/': '/projects/benri/',
    '/articles/flower-or-light/': '/projects/flower-or-light/',
    '/articles/haagen-dazs/': '/projects/haagen-dazs/',
    '/articles/it-will-be-the-internet/': '/projects/it-will-be-the-internet/',
    '/articles/life-2020/': '/projects/life-2020/',
    '/articles/optical-fiber/': '/projects/optical-fiber/',
    '/articles/packing/': '/projects/packing/',
    '/articles/past-life/': '/projects/past-life/',
    '/articles/searching-for-internet/': '/projects/searching-for-internet/',
    '/articles/shika-to-jitsuzon/': '/projects/shika-to-jitsuzon/',
    '/articles/shojiki-shika-science/': '/projects/shojiki-shika-science/',
    '/articles/tsubuan-and-margarine/': '/projects/tsubuan-and-margarine/',
    '/articles/vase/': '/projects/vase/',
    '/articles/virtual-background/': '/projects/virtual-background/',
    '/articles/walking/': '/projects/walking/',
    '/articles/yami/': '/projects/yami/'
  }
});

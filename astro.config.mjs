import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import compress from "astro-compress";

export default defineConfig({
  integrations: [react(), compress()],
  site: 'https://shikakun.com',
  trailingSlash: 'always'
});

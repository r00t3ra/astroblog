// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [react(), mdx(), sitemap(), cloudflare()],
  output: "server",
  adapter: cloudflare(),
});

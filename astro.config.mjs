import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://mxta-o.github.io',
  integrations: [
    tailwind(),
    svelte()
  ],
  vite: {
    ssr: {
      noExternal: ['three', '@threlte/core', '@threlte/extras']
    }
  }
});

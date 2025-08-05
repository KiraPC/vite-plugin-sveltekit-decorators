import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { svelteKitDecorators } from 'vite-plugin-sveltekit-decorators';

export default defineConfig({
  plugins: [
    sveltekit(),
    svelteKitDecorators({
      enabled: true,
      debug: false
    })
  ]
});

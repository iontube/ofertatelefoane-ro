import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ofertatelefoane.ro',
  output: 'static',
  build: {
    assets: 'assets',
    inlineStylesheets: 'always'
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  vite: {
    build: {
      cssMinify: true,
      minify: true
    }
  }
});

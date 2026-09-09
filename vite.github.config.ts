import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];

export default defineConfig({
  root: path.join(projectRoot, 'github'),
  base: repositoryName ? `/${repositoryName}/` : '/',
  publicDir: path.join(projectRoot, 'public'),
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': projectRoot } },
  plugins: [react()],
  build: {
    outDir: path.join(projectRoot, 'github-dist'),
    emptyOutDir: true,
  },
});

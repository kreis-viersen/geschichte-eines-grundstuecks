import { defineConfig } from 'vite';
import { createViteLicensePlugin } from 'rollup-license-plugin';
import {
  formatThirdPartyNotices,
  isUnacceptableLicense,
  licenseOverrides
} from './license-policy.mjs';

export default defineConfig({
  // Relative URLs erlauben die Veröffentlichung im Unterpfad einer
  // GitHub-Pages-Projektseite und auf beliebigen statischen Webservern.
  base: './',
  plugins: [
    createViteLicensePlugin({
      outputFilename: 'licenses/oss-licenses.json',
      replenishDefaultLicenseTexts: true,
      licenseOverrides,
      unacceptableLicenseTest: isUnacceptableLicense,
      additionalFiles: {
        'licenses/THIRD-PARTY-NOTICES.md': formatThirdPartyNotices
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  preview: {
    host: '0.0.0.0'
  },
  server: {
    host: '0.0.0.0'
  }
});

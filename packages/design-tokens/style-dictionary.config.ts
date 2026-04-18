import type { Config } from 'style-dictionary';

const config: Config = {
  source: ['src/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'sd',
      buildPath: 'dist/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            selector: ':root',
          },
        },
      ],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [
        {
          destination: 'index.js',
          format: 'javascript/esm',
        },
      ],
    },
    ts: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [
        {
          destination: 'index.d.ts',
          format: 'typescript/esm-declarations',
        },
      ],
    },
  },
};

export default config;

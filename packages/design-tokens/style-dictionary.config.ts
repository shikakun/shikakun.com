import type { Config } from 'style-dictionary';

const config: Config = {
  hooks: {
    formats: {
      'typescript/shikakun-declarations': ({ dictionary }) => {
        const lines: string[] = [];
        lines.push('/**');
        lines.push(' * Do not edit directly, this file was auto-generated.');
        lines.push(' */');
        lines.push('');

        for (const token of dictionary.allTokens) {
          if (token.$description) {
            lines.push(`/** ${token.$description} */`);
          }
          const type = typeof token.$value === 'number' ? 'number' : 'string';
          lines.push(`export const ${token.name}: ${type};`);
        }

        lines.push('');

        type LeafType = 'string' | 'number';
        type CategoryMap = Map<string, LeafType | Map<string, LeafType>>;

        const categories = new Map<string, CategoryMap>();

        for (const token of dictionary.allTokens) {
          if (token.path[0] !== 'typography') continue;
          const [, category, ...rest] = token.path;
          const type: LeafType = typeof token.$value === 'number' ? 'number' : 'string';

          let catMap = categories.get(category);
          if (!catMap) {
            catMap = new Map();
            categories.set(category, catMap);
          }

          if (rest.length === 1) {
            catMap.set(rest[0], type);
          } else if (rest.length === 2) {
            if (!catMap.has(rest[0])) catMap.set(rest[0], new Map());
            const existing = catMap.get(rest[0]);
            if (existing instanceof Map) {
              existing.set(rest[1], type);
            }
          }
        }

        const q = (key: string) => (/^\d/.test(key) ? `'${key}'` : key);
        const ind = '  ';

        lines.push('export declare const Typography: {');
        for (const [category, catMap] of categories) {
          lines.push(`${ind}readonly ${category}: {`);
          for (const [key, value] of catMap) {
            if (typeof value === 'string') {
              lines.push(`${ind}${ind}readonly ${q(key)}: ${value};`);
            } else {
              lines.push(`${ind}${ind}readonly ${q(key)}: {`);
              for (const [subKey, subType] of value) {
                lines.push(`${ind}${ind}${ind}readonly ${subKey}: ${subType};`);
              }
              lines.push(`${ind}${ind}};`);
            }
          }
          lines.push(`${ind}};`);
        }
        lines.push('};');

        return `${lines.join('\n')}\n`;
      },
    },
  },
  source: ['src/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
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
          format: 'typescript/shikakun-declarations',
        },
      ],
    },
  },
};

export default config;

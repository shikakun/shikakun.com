# shikakun.com

Personal website monorepo.

## Packages

| Package | Description |
|---------|-------------|
| [`@shikakun/tokens`](./packages/tokens) | Design tokens (typography) |
| [`@shikakun/react`](./packages/react) | React component library |
| [`apps/web`](./apps/web) | Astro website |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/)

### Setup

```sh
pnpm install
```

### Build all packages

```sh
pnpm build
```

### Lint & format

```sh
pnpm lint
pnpm format
```

### Start Storybook

```sh
pnpm storybook
```

### Run tests

```sh
pnpm test
```

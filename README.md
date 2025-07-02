[![Code checks](https://github.com/Omochice/vite-plugin-inject-readme/actions/workflows/check.yml/badge.svg)](https://github.com/Omochice/vite-plugin-inject-readme/actions/workflows/check.yml)
[![NPM Version](https://img.shields.io/npm/v/%40omochice%2Fvite-plugin-inject-readme)](https://www.npmjs.com/package/@omochice/vite-plugin-inject-readme?activeTab=readme)

# vite-plugin-inject-readme

A vite plugin to inject `README.md` into `index.html`.

## Install

```sh
npm install --save-dev @omochice/vite-plugin-inject-readme
```

## Usage

```ts
import { defineConfig } from "vite";
import injectReadme from "@omochice/vite-plugin-inject-readme";

export default defineConfig({
  plugins: [
    injectReadme({
      /**
       * Path to README.md
       * It will resolve from the parent directory of vite.config.ts
       * default: `"./README.md"`
       */
      readme: "./README.md",
      /**
       * Replace marker
       * default: `"<!-- README.md -->"`
       */
      marker: "<!-- README.md -->",
    }),
  ]
});
```

## License

See [LICENSE file](./LICENSE).

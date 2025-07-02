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

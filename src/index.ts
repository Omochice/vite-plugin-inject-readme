import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { Plugin } from "vite";

type Option = {
	/**
	 * Path to README.md
	 * It will resolve from the parent directory of vite.config.ts
	 * default: `"./README.md"`
	 */
	readme?: string;
	/**
	 * Replace marker
	 * default: `"<!-- README.md -->"`
	 */
	marker?: string;
};

/**
 * A vite plugin to inject README.md into index.html
 * @param option - Plugin option
 * @param option.readme - Path to README.md. default: `"./README.md"`
 * @param option.marker - Replace marker. default: `"<!-- README.md -->"`
 * @return - A vite plugin
 */
const injectReadme = (option: Partial<Option> = {}) => {
	const processor = unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(remarkGfm)
		.use(rehypeStringify);
	let pathToConfig: string | undefined;
	const plugin = {
		name: "vite-plugin-readme-inject",
		configResolved: ({ configFile }) => {
			pathToConfig = configFile;
		},
		transformIndexHtml: async (html) => {
			if (pathToConfig == null) {
				throw new Error("unprocessable error");
			}
			const { readme = "./README.md", marker = "<!-- README.md -->" } = option;
			const readmePath = resolve(dirname(pathToConfig), readme);
			const markdown = readFileSync(readmePath, "utf8");
			const parsed = await processor.process(markdown);
			return html.replaceAll(marker, parsed.toString());
		},
	} as const satisfies Plugin;
	return plugin;
};

export default injectReadme;

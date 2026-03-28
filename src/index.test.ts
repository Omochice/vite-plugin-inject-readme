import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import injectReadme from "./index.js";

function setupPlugin(
  option: Parameters<typeof injectReadme>[0] = {},
  configDir?: string,
) {
  const plugin = injectReadme(option);
  const dir = configDir ?? mkdtempSync(join(tmpdir(), "vite-plugin-test-"));
  plugin.configResolved({ configFile: join(dir, "vite.config.ts") } as never);
  return { plugin, dir };
}

describe("injectReadme", () => {
  it("returns a plugin with the expected name", () => {
    const plugin = injectReadme();
    expect(plugin.name).toBe("vite-plugin-inject-readme");
  });

  it("returns a plugin with configResolved and transformIndexHtml hooks", () => {
    const plugin = injectReadme();
    expect(plugin.configResolved).toBeTypeOf("function");
    expect(plugin.transformIndexHtml).toBeTypeOf("function");
  });

  it("throws when configResolved has not been called", async () => {
    const plugin = injectReadme();
    await expect(
      plugin.transformIndexHtml("<html><!-- README.md --></html>", {} as never),
    ).rejects.toThrow("vite config is not found");
  });

  it("replaces the default marker with processed README content", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vite-plugin-test-"));
    writeFileSync(join(dir, "README.md"), "# Hello\n\nWorld");
    const { plugin } = setupPlugin({}, dir);

    const result = await plugin.transformIndexHtml(
      "<html><!-- README.md --></html>",
      {} as never,
    );

    expect(result).toContain("<h1>Hello</h1>");
    expect(result).toContain("<p>World</p>");
    expect(result).not.toContain("<!-- README.md -->");
  });

  it("replaces a custom marker", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vite-plugin-test-"));
    writeFileSync(join(dir, "README.md"), "**bold**");
    const { plugin } = setupPlugin({ marker: "{{readme}}" }, dir);

    const result = await plugin.transformIndexHtml(
      "<div>{{readme}}</div>",
      {} as never,
    );

    expect(result).toContain("<strong>bold</strong>");
    expect(result).not.toContain("{{readme}}");
  });

  it("reads from a custom readme path", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vite-plugin-test-"));
    writeFileSync(join(dir, "DOCS.md"), "custom content");
    const { plugin } = setupPlugin({ readme: "./DOCS.md" }, dir);

    const result = await plugin.transformIndexHtml(
      "<!-- README.md -->",
      {} as never,
    );

    expect(result).toContain("custom content");
  });

  it("replaces all occurrences of the marker", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vite-plugin-test-"));
    writeFileSync(join(dir, "README.md"), "text");
    const { plugin } = setupPlugin({}, dir);

    const result = await plugin.transformIndexHtml(
      "<!-- README.md -->|<!-- README.md -->",
      {} as never,
    );

    const parts = result.split("|");
    expect(parts[0]).toBe(parts[1]);
    expect(parts[0]).toContain("text");
  });

  it("processes GFM features like tables", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vite-plugin-test-"));
    const table = "| a | b |\n| - | - |\n| 1 | 2 |";
    writeFileSync(join(dir, "README.md"), table);
    const { plugin } = setupPlugin({}, dir);

    const result = await plugin.transformIndexHtml(
      "<!-- README.md -->",
      {} as never,
    );

    expect(result).toContain("<table>");
    expect(result).toContain("<td>1</td>");
  });
});

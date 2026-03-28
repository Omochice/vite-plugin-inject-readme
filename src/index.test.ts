import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import injectReadme from "./index.js";

function createTempDir(): { path: string } & Disposable {
  const path = mkdtempSync(join(tmpdir(), "vite-plugin-test-"));
  return {
    path,
    [Symbol.dispose]() {
      rmSync(path, { recursive: true, force: true });
    },
  };
}

function setupPlugin(option: Parameters<typeof injectReadme>[0], dir: string) {
  const plugin = injectReadme(option);
  plugin.configResolved.call(
    {} as never,
    { configFile: join(dir, "vite.config.ts") } as never,
  );
  return { plugin };
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
      plugin.transformIndexHtml.call(
        {} as never,
        "<html><!-- README.md --></html>",
      ),
    ).rejects.toThrow("vite config is not found");
  });

  it("replaces the default marker with processed README content", async () => {
    using tempDir = createTempDir();
    writeFileSync(join(tempDir.path, "README.md"), "# Hello\n\nWorld");
    const { plugin } = setupPlugin({}, tempDir.path);

    const result = await plugin.transformIndexHtml.call(
      {} as never,
      "<html><!-- README.md --></html>",
    );

    expect(result).toContain("<h1>Hello</h1>");
    expect(result).toContain("<p>World</p>");
    expect(result).not.toContain("<!-- README.md -->");
  });

  it("replaces a custom marker", async () => {
    using tempDir = createTempDir();
    writeFileSync(join(tempDir.path, "README.md"), "**bold**");
    const { plugin } = setupPlugin({ marker: "{{readme}}" }, tempDir.path);

    const result = await plugin.transformIndexHtml.call(
      {} as never,
      "<div>{{readme}}</div>",
    );

    expect(result).toContain("<strong>bold</strong>");
    expect(result).not.toContain("{{readme}}");
  });

  it("reads from a custom readme path", async () => {
    using tempDir = createTempDir();
    writeFileSync(join(tempDir.path, "DOCS.md"), "custom content");
    const { plugin } = setupPlugin({ readme: "./DOCS.md" }, tempDir.path);

    const result = await plugin.transformIndexHtml.call(
      {} as never,
      "<!-- README.md -->",
    );

    expect(result).toContain("custom content");
  });

  it("replaces all occurrences of the marker", async () => {
    using tempDir = createTempDir();
    writeFileSync(join(tempDir.path, "README.md"), "text");
    const { plugin } = setupPlugin({}, tempDir.path);

    const result = await plugin.transformIndexHtml.call(
      {} as never,
      "<!-- README.md -->|<!-- README.md -->",
    );

    const parts = result.split("|");
    expect(parts[0]).toBe(parts[1]);
    expect(parts[0]).toContain("text");
  });

  it("processes GFM features like tables", async () => {
    using tempDir = createTempDir();
    const table = "| a | b |\n| - | - |\n| 1 | 2 |";
    writeFileSync(join(tempDir.path, "README.md"), table);
    const { plugin } = setupPlugin({}, tempDir.path);

    const result = await plugin.transformIndexHtml.call(
      {} as never,
      "<!-- README.md -->",
    );

    expect(result).toContain("<table>");
    expect(result).toContain("<td>1</td>");
  });
});

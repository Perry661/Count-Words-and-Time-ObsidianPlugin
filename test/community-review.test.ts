import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readProjectFile = (fileName: string): string =>
  readFileSync(new URL(`../${fileName}`, import.meta.url), "utf8");

test("declares the minimum Obsidian version required by the settings API", () => {
  const manifest = JSON.parse(readProjectFile("manifest.json")) as {
    minAppVersion?: unknown;
  };

  assert.equal(manifest.minAppVersion, "1.13.0");
});

test("keeps all plugin release version sources in sync", () => {
  const manifest = JSON.parse(readProjectFile("manifest.json")) as {
    minAppVersion?: unknown;
    version?: unknown;
  };
  const packageJson = JSON.parse(readProjectFile("package.json")) as {
    version?: unknown;
  };
  const packageLock = JSON.parse(readProjectFile("package-lock.json")) as {
    version?: unknown;
    packages?: { ""?: { version?: unknown } };
  };
  const versions = JSON.parse(readProjectFile("versions.json")) as Record<string, unknown>;

  assert.equal(manifest.version, packageJson.version);
  assert.equal(packageLock.version, packageJson.version);
  assert.equal(packageLock.packages?.[""]?.version, packageJson.version);
  assert.equal(versions[String(packageJson.version)], manifest.minAppVersion);
});

test("uses declarative settings definitions instead of deprecated display rendering", () => {
  const settingsSource = readProjectFile("settings.ts");

  assert.match(settingsSource, /getSettingDefinitions\(\)/);
  assert.doesNotMatch(settingsSource, /\bdisplay\(\): void/);
  assert.doesNotMatch(settingsSource, /createEl\(["']h[1-6]["']/);
});

test("handles revealLeaf promises explicitly", () => {
  const mainSource = readProjectFile("main.ts");
  const unhandledRevealCalls = mainSource
    .split("\n")
    .filter((line) => line.includes("revealLeaf(") && !line.includes("await "));

  assert.deepEqual(unhandledRevealCalls, []);
});

test("treats persisted plugin data as untrusted and avoids unnecessary assertions", () => {
  const mainSource = readProjectFile("main.ts");

  assert.match(mainSource, /const storedData: unknown = await this\.loadData\(\)/);
  assert.doesNotMatch(mainSource, /editor as object/);
});

test("uses Node's builtin module list instead of the deprecated package", () => {
  const buildSource = readProjectFile("esbuild.config.mjs");
  const packageJson = readProjectFile("package.json");

  assert.match(buildSource, /from "node:module"/);
  assert.doesNotMatch(buildSource, /from "builtin-modules"/);
  assert.doesNotMatch(packageJson, /"builtin-modules"/);
});
